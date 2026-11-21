# Contrato · EP6 Planes de entrenamiento y seguimiento

Complementa [`api-contracts.md`](./api-contracts.md) con lo agregado por esta épica
(H12 · asignación de rutinas, H13 · progreso físico).

## Páginas

| Historia | Módulo | Ruta | Rol |
| --- | --- | --- | --- |
| H12 | Asignación de rutinas | `/trainer/routines` | `ENTRENADOR` |
| H13 | Registro de medidas | `/progress/new` | `MIEMBRO` |
| H13 | Consulta del progreso | `/progress` | `MIEMBRO` |

## Endpoints

| Módulo | Método | Ruta | Roles |
| --- | --- | --- | --- |
| Rutinas | `POST` | `/api/routines` | `ENTRENADOR` |
| Progreso | `POST` | `/api/progress` | `MIEMBRO` |
| Progreso | `GET` | `/api/progress` | **no implementado** (`404`) |
| Miembros | `GET` | `/api/users?role=MIEMBRO&search=` | `RECEPCION_ADMIN` (el entrenador recibe `403`) |

## Respuestas verificadas contra `API de pruebas`

| Endpoint | Respuesta |
| --- | --- |
| `POST /api/routines` | `201 { routineId, memberId, updatedAt }`; `400 {"error":"La rutina requiere al menos un ejercicio"}` sin ejercicios; `403` fuera del rol. |
| `POST /api/progress` | `201 { progressId, memberId, date }`; `400 {"error":"Métricas inválidas"}` cuando el peso sale de 20–500; `403` fuera del rol. |
| `GET /api/progress` | `404 {"error":"Endpoint no encontrado"}`. |
| `GET /api/users?role=MIEMBRO&search=` | `403 {"error":"El usuario no posee el rol requerido"}` para `ENTRENADOR`. |

## Validaciones de la UI

El backend **no valida** varios campos; estas reglas se aplican en el formulario y se repiten
en la Server Action ([`lib/training-rules.ts`](../lib/training-rules.ts)):

| Campo | Regla | Origen |
| --- | --- | --- |
| `exercises` | Al menos uno; máximo 30 por rutina | `BE-12.1` («400 si no hay ejercicios») + límite de UI |
| `exercises[].name` | 2–100 caracteres | Límite de UI (el backend acepta vacío) |
| `exercises[].series` | Entero 1–20 | Límite de UI (el backend acepta `0` y negativos) |
| `exercises[].reps` | Entero 1–100 | Límite de UI (el backend acepta `0` y negativos) |
| `weight` | 20–500 kg | `BE-13.1` (el backend también lo valida) |
| `waist` / `chest` | 30–300 cm | `BE-13.1` (el backend **no** lo valida) |
| `date` | `YYYY-MM-DD`, no futura | `BE-13.1` (el backend acepta fechas futuras) |
| `strengthMarks[]` | Texto ≤ 80 caracteres, opcional | Límite de UI |

## Bloqueos del backend y cómo se resuelven

1. **No existe un listado de clientes del entrenador.** El selector intenta
   `GET /api/users?role=MIEMBRO&search=`; como responde `403`, la pantalla muestra
   «Tu rol no puede consultar el padrón» con la explicación («El backend solo permite listar
   miembros a recepción/administración. Pide el identificador del miembro a recepción y
   captúralo aquí») y habilita la captura manual del identificador. Tras el `403` no se
   repiten las consultas al escribir, para no generar llamadas inútiles. No se rompe ni se
   inventan clientes.

   **Pendiente de backend:** `TSK-136 · BE-12.2` autoriza `GET /api/users?role=MIEMBRO&search=`
   al rol `ENTRENADOR` (solo lectura y solo `role=MIEMBRO`). Bloquea a `TSK-91 · FE-12.1`.
   Cuando se implemente, el fallback de captura manual se puede retirar de
   [`components/training/member-selector.tsx`](../components/training/member-selector.tsx).
2. **No existe `GET` del historial de progreso.** `/progress` trata el `404` como «sin
   historial» (no como error), muestra el estado vacío «Aún no hay registros» y deja listo
   el gráfico (`ProgressChart`, SVG propio) y la tabla para cuando el endpoint exista.
   El `POST` sí persiste la medición: la confirmación en `/progress/new` muestra lo
   registrado.

## Tipos y capa de datos

| Módulo | Archivo |
| --- | --- |
| Tipos y límites | [`lib/types/training.ts`](../lib/types/training.ts) |
| Reglas de validación | [`lib/training-rules.ts`](../lib/training-rules.ts) |
| Adaptador | [`lib/api/training.ts`](../lib/api/training.ts) |
| Acciones | [`app/actions/training.ts`](../app/actions/training.ts) |

`normalizeCreatedProgress` completa `weight`, `waist` y `chest` con lo que el miembro envió
(el backend solo confirma `progressId`, `memberId` y `date`); nunca inventa métricas.

## Estados de pantalla

| Historia | Cargando | Vacío | Éxito | Error |
| --- | --- | --- | --- | --- |
| H12 | `loading.tsx` + spinner al enviar | — | Folio de la rutina + toast | `Alert` con el mensaje del backend y errores por ejercicio |
| H13 | `loading.tsx` en ambas rutas | «Aún no hay registros» | Confirmación de la medición + toast | `Alert` con el mensaje del backend y errores por campo |

## Verificación

`npm test` (28 pruebas en 6 archivos) y `npm run build` pasan. Probado a mano contra la
`API de pruebas` el 2026-11-20:

- Entrenador: la búsqueda de clientes informa el `403`, la captura manual asigna la rutina
  (`routine-035168ad…`) y la validación rechaza nombre vacío y `series = 0`.
- Miembro: `weight = 10` se rechaza con «El valor debe estar entre 20 y 500 kg»; una
  medición válida responde `201` y la confirmación muestra fecha y métricas.
- Guards: un entrenador que abre `/progress` o `/progress/new` es redirigido a `/`, y un
  miembro que abre `/trainer/routines` también.
