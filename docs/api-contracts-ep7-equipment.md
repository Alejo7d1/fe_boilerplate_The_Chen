# Contrato · EP7 Control de equipo y mantenimiento

Complementa [`api-contracts.md`](./api-contracts.md) con lo agregado por esta épica
(H14 · administración de máquinas, H15 · consulta de disponibilidad).

## Páginas

| Historia | Módulo | Ruta | Rol |
| --- | --- | --- | --- |
| H14 | Administración de estados de máquinas | `/admin/equipment` | `RECEPCION_ADMIN` |
| H15 | Consulta de disponibilidad de máquinas | `/equipment` | `MIEMBRO`, `ENTRENADOR`, `RECEPCION_ADMIN` |

## Endpoints

| Módulo | Método | Ruta | Roles |
| --- | --- | --- | --- |
| Máquinas | `GET` | `/api/equipment?status=<estado>` | Autenticados |
| Máquinas | `PATCH` | `/api/equipment/:id/status` | `RECEPCION_ADMIN` |

## Respuestas verificadas contra `API de pruebas`

| Endpoint | Respuesta |
| --- | --- |
| `GET /api/equipment?status=` | `{ data: [{ id, name, category, status, reason, updatedAt }] }`; estados `Operativa` / `En Mantenimiento` / `Fuera de Servicio`; ordenado por `name`; `400` si el estado no existe. |
| `PATCH /api/equipment/:id/status` | Recibe `{ status, reason }`; exige `reason` de al menos 5 caracteres cuando el estado no es `Operativa` y lo limpia al volver a `Operativa`. Responde un resumen del cambio (`equipmentId`, `previousStatus`, `newStatus`, `reason`, `updatedBy`, `updatedAt`). |

Un estado fuera del catálogo se reporta como `ContractError`; nunca se asume uno por defecto.

## Tipos compartidos

| Módulo | Archivo |
| --- | --- |
| Máquinas | [`lib/types/equipment.ts`](../lib/types/equipment.ts) |
