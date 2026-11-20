# Contrato · EP5 Pagos y facturación

Complementa [`api-contracts.md`](./api-contracts.md) con lo agregado por esta épica
(H10 · cobro y comprobante, H11 · cobros pendientes).

## Páginas

| Historia | Módulo | Ruta | Rol |
| --- | --- | --- | --- |
| H10 | Cobro y comprobante | `/payments/process?chargeId=<id>` | `MIEMBRO` |
| H11 | Cobros pendientes | `/admin/pending-charges` | `RECEPCION_ADMIN` |

`chargeId` llega por query string. Sin él, la pantalla de H10 muestra un estado vacío
explicativo; no se inventa un cobro.

## Endpoints

| Módulo | Método | Ruta | Roles |
| --- | --- | --- | --- |
| Pagos | `POST` | `/api/payments/process` | `MIEMBRO` |
| Pagos | `GET` | `/api/charges/pending?page=&limit=&startDate=&endDate=&memberId=` | `RECEPCION_ADMIN` |
| Miembros | `GET` | `/api/users?role=MIEMBRO&search=` | `RECEPCION_ADMIN` (selector de filtro) |

## Payloads

`POST /api/payments/process` recibe `{ chargeId, cardNumber, expMonth, expYear, cvv }`.
El formulario valida en el cliente y en la Server Action: titular 3-100 caracteres,
tarjeta de 16 dígitos, vencimiento `MM/YY` no vencido y CVV de 3-4 dígitos
([`lib/payment-card.ts`](../lib/payment-card.ts)). El nombre del titular se valida pero no
se envía, porque no forma parte del cuerpo del contrato.

Respuesta esperada del cobro aprobado: `{ receiptNumber, amount, paidAt, concept, last4,
status }`, con `receiptNumber` en formato `REC-XXXXX`. El adaptador acepta el comprobante
plano o envuelto en `receipt` / `data` y nombres alternativos (`monto`, `fecha`,
`concepto`, `cardLast4`). `receiptNumber` es obligatorio: sin él se lanza `ContractError`.
`last4` cae a los últimos cuatro dígitos de la tarjeta enviada solo si el backend no lo
devuelve.

`GET /api/charges/pending` se espera como `{ data: [{ id, memberId, memberName,
cardNumber, concept, amount, dueDate, status }], total, page, limit, totalPages }`. Si el
backend no envía la paginación, `total` y `totalPages` se calculan sobre lo recibido; nunca
se inventan cobros adicionales. El listado muestra 10 cobros por página.

## Respuestas verificadas contra `API de pruebas`

Verificado el 2026-11-20 con las credenciales del plan.

| Endpoint | Respuesta |
| --- | --- |
| `GET /api/charges/pending` | `{ data: [{ id, memberId, concept, amount, status, createdAt, memberName }], total, page, totalPages }`; `status: "Pendiente"`; no devuelve `limit` (se usa el solicitado). |
| `POST /api/payments/process` | `200 { receiptNumber: "REC-00001", status: "Pagado", amount, date, concept, last4 }` |
| `GET /api/users?role=MIEMBRO&search=` | `{ data: [{ id, email, role, name, cardNumber }] }`; busca por nombre y por carné. |

**Limitación del backend de pruebas:** `page` se respeta, pero `limit`, `startDate`,
`endDate` y `memberId` se ignoran y el listado llega completo. La UI envía los parámetros
del contrato (H11) y los aplicará en cuanto el backend los soporte; no filtra en cliente
para no desalinearse de la paginación del servidor.

## Errores verificados en la API de pruebas

| Código | Caso | Cuerpo | Comportamiento de la UI |
| --- | --- | --- | --- |
| `403` | Cobro de otro miembro | `{"error":"El cobro no pertenece al usuario"}` | Alerta con el mensaje del backend |
| `409` | Cobro ya pagado | `{"error":"El cobro ya fue procesado"}` | Alerta y el formulario queda disponible para reintentar |
| `400` | Tarjeta terminada en `0002` | `{"error":"Fondos insuficientes / Tarjeta declinada"}` | Alerta con el mensaje del backend |

El mensaje del backend se muestra tal cual (regla de
[`testing-strategy.md`](./testing-strategy.md)); solo se usa copy propio cuando la respuesta
no trae cuerpo.

## Estados de pantalla

- **Cargando**: `loading.tsx` en ambas rutas y spinner al refrescar el listado.
- **Vacío**: H10 sin `chargeId`; H11 con «No hay pagos pendientes registrados».
- **Éxito**: comprobante con opción de imprimir (H10); tabla paginada (H11).
- **Error**: `RetryError` en la carga inicial; `Alert` al filtrar o cobrar.

## Tipos y adaptadores

| Módulo | Archivo |
| --- | --- |
| Pagos | [`lib/types/payments.ts`](../lib/types/payments.ts) |
| Adaptador | [`lib/api/payments.ts`](../lib/api/payments.ts) |
| Validación de tarjeta | [`lib/payment-card.ts`](../lib/payment-card.ts) |
| Acciones | [`app/actions/payments.ts`](../app/actions/payments.ts) |

## Verificación

`npm test` (26 pruebas en 5 archivos) y `npm run build` pasan. Probado a mano contra la
`API de pruebas` el 2026-11-20: cobro aprobado con comprobante `REC-00005`, rechazo por
fondos insuficientes, `409` al reintentar un cobro pagado y listado administrativo con el
cobro pendiente. Si el backend cambia algún nombre de campo, se corrige en un solo archivo:
[`lib/api/payments.ts`](../lib/api/payments.ts).
