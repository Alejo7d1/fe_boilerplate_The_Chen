# Contrato · EP8 Reseñas y calificaciones

Complementa [`api-contracts.md`](./api-contracts.md) con lo agregado por esta épica
(H16 · calificar clases, H17 · reporte de promedios).

## Páginas

| Historia | Módulo | Ruta | Rol |
| --- | --- | --- | --- |
| H16 | Calificación de clases | `/reviews` | `MIEMBRO` |
| H17 | Reporte de promedios de reseñas | `/admin/reports/reviews` | `RECEPCION_ADMIN` |

## Endpoints

| Módulo | Método | Ruta | Roles |
| --- | --- | --- | --- |
| Reseñas | `POST` | `/api/reviews` | `MIEMBRO` |
| Reseñas | `GET` | `/api/reviews/analytics?startDate&endDate&trainerId&classId` | `RECEPCION_ADMIN` |

## Respuestas verificadas contra `API de pruebas`

| Endpoint | Respuesta |
| --- | --- |
| `POST /api/reviews` | Recibe `{ sessionId, rating, comment? }`. `201` → `{ reviewId, sessionId, rating, createdAt }`. `400` «Reseña inválida» cuando `rating` no es entero de 1 a 5 o el comentario supera 300 caracteres. `409` «Ya existe una reseña» al repetir la sesión. `403` sin asistencia o fuera del plazo de 7 días. |
| `GET /api/reviews/analytics` | `{ data: [{ targetType, targetId, targetName, average, totalReviews }] }`. `average` llega en `null` cuando el objetivo no tiene reseñas. La API de pruebas ignora `startDate`, `endDate`, `trainerId` y `classId`; la UI los envía igual porque forman parte del contrato. |

### Contrato divergente en el reporte (BE-17.1)

`BE-17.1` documenta `{ byTrainer, byClass }`; la API de pruebas devuelve
`{ data: [...] }` con `targetType`. El adaptador
([`lib/api/reviews.ts`](../lib/api/reviews.ts)) tolera ambas formas: en
`{ byTrainer, byClass }` el tipo de objetivo se infiere de la colección
(`TRAINER` / `CLASS`).

`average` y `totalReviews` se conservan en `null` cuando el backend no los envía:
la tabla muestra «Sin calificaciones» y «—» en lugar de un valor supuesto.

## Origen de las clases calificables (H16)

No existe un endpoint de sesiones del miembro ni de reseñas propias. La pantalla
cruza `GET /api/reservations/me` con `GET /api/class-sessions` y conserva las
reservas `Activa` sobre sesiones con estado `Finalizada`. La regla vive en
[`lib/review-rules.ts`](../lib/review-rules.ts) (`buildReviewableClasses`).

## Limitaciones conocidas del backend de pruebas

| Limitación | Efecto en la UI |
| --- | --- |
| No hay `GET` de reseñas del miembro (`/api/reviews/me` → `404`). | Una clase ya calificada solo se marca en la sesión del navegador; al recargar se vuelve a ofrecer y el `409` la vuelve a marcar como «Calificada». |
| `GET /api/class-sessions` solo devuelve sesiones `Programada`. | `/reviews` muestra el estado vacío «Aún no hay clases por calificar» hasta que existan sesiones finalizadas. |
| No hay `GET` de sesiones personales. | Solo se califican clases grupales. |
| El alta de reseñas no valida asistencia ni plazo. | La UI aplica la ventana de 7 días con `isReviewWindowOpen`; el `403` del backend se muestra con su mensaje. |
| `GET /api/reviews/analytics` ignora los filtros. | El reporte envía los parámetros del contrato y los aplicará cuando el backend los soporte. |
| `GET /api/reviews/analytics` es un stub: responde `average: null` y `totalReviews: 0` por cada entrenador aunque existan reseñas. | El reporte se ve con «Sin calificaciones» aun después de calificar; la tabla con promedio y conteo se verifica en `components/reviews/review-analytics-table.test.tsx`. |

## Prueba manual de H16

La API de pruebas no crea clases finalizadas ni registra asistencia, así que el
escenario se arma con [`scripts/seed-ep8-review-demo.ps1`](../scripts/seed-ep8-review-demo.ps1):

```powershell
pwsh -File scripts/seed-ep8-review-demo.ps1
```

El script crea dos clases como `RECEPCION_ADMIN`, reserva el cupo con
`miembro.activo@thechen.com` y recién entonces las marca `Finalizada` (el backend
rechaza reservar una clase ya finalizada):

| Clase | Fecha | Estado esperado en `/reviews` |
| --- | --- | --- |
| Clase Demo Reseña | hoy − 2 días | Tarjeta con botón «Calificar». |
| Clase Demo Fuera de Plazo | hoy − 10 días | «El plazo para calificar venció el …», sin botón. |

Los datos viven en memoria: reiniciar el proceso de la API los borra y hay que
volver a ejecutar el script.


## Tipos compartidos

| Módulo | Archivo |
| --- | --- |
| Reseñas | [`lib/types/reviews.ts`](../lib/types/reviews.ts) |
| Reglas y validación | [`lib/review-rules.ts`](../lib/review-rules.ts) |
| Adaptador de API | [`lib/api/reviews.ts`](../lib/api/reviews.ts) |
| Server Action | [`app/actions/reviews.ts`](../app/actions/reviews.ts) |
