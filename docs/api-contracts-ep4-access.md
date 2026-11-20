# Contrato · EP4 Check-in y control de acceso

Complementa [`api-contracts.md`](./api-contracts.md) con lo agregado por esta épica
(H9 · registro de ingreso de miembros).

## Página

| Historia | Módulo | Ruta | Rol |
| --- | --- | --- | --- |
| H9 | Registro de ingreso de miembros | `/admin/check-in` | `RECEPCION_ADMIN` |

## Endpoint

| Módulo | Método | Ruta | Roles |
| --- | --- | --- | --- |
| Accesos | `POST` | `/api/access/check-in` | `RECEPCION_ADMIN` |

## Respuesta verificada contra `API de pruebas`

| Endpoint | Respuesta |
| --- | --- |
| `POST /api/access/check-in` | Recibe `{ cardNumber, allowException }` y responde `201 { accessId, memberName, result, timestamp }` con `result` `Permitido` o `Excepcion`. `403` membresía vencida sin excepción, `404` carné no encontrado, `409` ingreso duplicado en menos de 5 minutos. |

## Estados de UI

| Respuesta | Comportamiento |
| --- | --- |
| `201` con `Permitido` | Banner verde «Acceso Autorizado». |
| `201` con `Excepcion` | Banner amarillo «Acceso Concedido por Excepción». |
| `403` | Banner rojo y se habilita el switch «Autorizar por Excepción» para reintentar. |
| `404` / `409` | Mensaje del backend sin romper la interfaz. |

## Limitación conocida

El backend de pruebas resuelve el miembro por **carné, id o correo**, no por nombre completo.
La historia H9 pide ambos, así que el nombre solo funciona si el backend lo implementa.

## Tipos compartidos

| Módulo | Archivo |
| --- | --- |
| Accesos | [`lib/types/access.ts`](../lib/types/access.ts) |
