# Contratos de API

Fuente de verdad de endpoints y roles: [`lib/api-routes.ts`](../lib/api-routes.ts) junto con la tabla de endpoints de este documento. Las rutas de backend **no** se escriben a mano en acciones, páginas ni componentes.

## Rutas de páginas

Las páginas usan nombres en inglés ([`decisiones.md`](../decisiones.md)). Las rutas descritas en Jira estaban en español, por lo que se tradujeron:

| Historia | Módulo | Ruta de página | Rol |
| --- | --- | --- | --- |
| H1 | Consulta del estado de membresía | `/membership` | `MIEMBRO` |
| H2 | Compra o renovación de membresía | `/membership/purchase` | `RECEPCION_ADMIN` |
| H3 | Administración de planes | `/admin/plans` | `RECEPCION_ADMIN` |
| H4 | Reserva de cupo en una clase | `/classes/book` | `MIEMBRO` |
| H5 | Cancelación de reserva | `/my-reservations` | `MIEMBRO` |
| H6 | Definición, edición y cancelación de clases | `/admin/classes` | `RECEPCION_ADMIN` |
| H7 | Bloques de disponibilidad del entrenador | `/trainer/availability` | `ENTRENADOR` |
| H8 | Agendamiento de sesión personal | `/trainers/book` | `MIEMBRO` |

La navegación se define en [`lib/navigation.ts`](../lib/navigation.ts). Una entrada con `available: false` se muestra deshabilitada con la etiqueta «Pronto» hasta que su historia se implemente.

## Endpoints por módulo

| Módulo | Método | Ruta | Roles |
| --- | --- | --- | --- |
| Autenticación | `POST` | `/api/auth/login` | Público |
| Autenticación | `POST` | `/api/users` | Público |
| Membresías | `GET` | `/api/memberships/me` | `MIEMBRO` |
| Membresías | `POST` | `/api/memberships/purchase` | `RECEPCION_ADMIN` |
| Planes | `GET` | `/api/plans` | Autenticados |
| Planes | `POST` | `/api/plans` | `RECEPCION_ADMIN` |
| Planes | `PUT` | `/api/plans/:id` | `RECEPCION_ADMIN` |
| Planes | `PATCH` | `/api/plans/:id/status` | `RECEPCION_ADMIN` |
| Clases | `GET` | `/api/class-sessions` | Autenticados |
| Clases | `POST` | `/api/classes` | `RECEPCION_ADMIN` |
| Clases | `PUT` | `/api/classes/:id` | `RECEPCION_ADMIN` |
| Clases | `PATCH` | `/api/classes/:id/cancel` | `RECEPCION_ADMIN` |
| Clases | `POST` | `/api/class-sessions/:id/reserve` | `MIEMBRO` |
| Reservas | `GET` | `/api/reservations/me` | `MIEMBRO` |
| Reservas | `DELETE` | `/api/reservations/:id` | `MIEMBRO` |
| Entrenadores | `GET` | `/api/trainers` | Autenticados |
| Entrenadores | `GET` | `/api/trainers/:id/availability` | Autenticados |
| Entrenadores | `POST` | `/api/trainer-availability` | `ENTRENADOR` |
| Entrenadores | `POST` | `/api/personal-sessions` | `MIEMBRO` |
| Pagos | `GET` | `/api/charges/pending` | `RECEPCION_ADMIN` |
| Pagos | `POST` | `/api/payments/process` | `MIEMBRO` |

## Tipos compartidos

| Módulo | Archivo |
| --- | --- |
| Primitivas (`EntityId`, `IsoDate`, `IsoTime`, `ApiErrorBody`) | [`lib/types/common.ts`](../lib/types/common.ts) |
| Membresías | [`lib/types/memberships.ts`](../lib/types/memberships.ts) |
| Planes | [`lib/types/plans.ts`](../lib/types/plans.ts) |
| Clases y reservas | [`lib/types/classes.ts`](../lib/types/classes.ts) |
| Entrenadores y disponibilidad | [`lib/types/trainers.ts`](../lib/types/trainers.ts) |
| Pagos | [`lib/types/payments.ts`](../lib/types/payments.ts) |

## Huecos de contrato pendientes de Backend

Los siguientes puntos no están documentados y quedaron marcados con `TODO(contract)` en los tipos. **No deben resolverse con valores por defecto**: hay que confirmarlos antes de la integración de cada historia.

| Historia | Hueco |
| --- | --- |
| H1 | Respuesta de `GET /api/memberships/me`: no hay esquema ni valores de estado; `expiresAt` es un nombre propuesto. |
| H2 | Cuerpo de `POST /api/memberships/purchase` y su respuesta no están documentados. |
| H3 | Esquema de plan y valores aceptados por `PATCH /api/plans/:id/status`; unidad de `duration`. |
| H5 | Cuerpo y respuesta de `DELETE /api/reservations/:id`. |
| H7 | No existe una ruta nombrada para `GET /api/trainer-availability` en `API_ROUTES`; solo está `createAvailability` (`POST`). Falta decidir si se agrega una clave para el `GET`. |
| H8 | Cuerpo y respuesta de `POST /api/personal-sessions`; nombre del identificador de sesión. |
| Pagos | BE-10.1 documenta `POST /api/v1/payments/process`, mientras que `API_ROUTES` define `/api/payments/process`. |
| Pagos | Nombre del campo del comprobante en la respuesta (`receiptNumber` es un nombre propuesto). |

## Estado de la autenticación

El rol del sidebar se lee del claim `role` del JWT mediante [`getSessionData`](../lib/session.ts). Si el token no incluye ese claim, el sidebar queda vacío con un aviso y no se asume ningún rol.
