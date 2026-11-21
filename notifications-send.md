# `POST /api/notifications/send` — envío manual de notificaciones

Guía de integración para el frontend. Cubre el contrato exacto, los errores que hay que
interpretar y las trampas que ya nos costaron una pantalla rota en otros endpoints.

- **Ruta:** `POST {API_URL}/api/notifications/send`
- **Roles:** `RECEPCION_ADMIN` (sin restricción de destinatario) · `ENTRENADOR` (solo sus miembros)
- **Respuesta:** `201` con `{ sent, notificationIds }`

---

## 1. Qué hace y qué no

Es un **despacho**, no un chat: el backend crea **una notificación por destinatario**, así que cada
persona la ve en su propia bandeja (`GET /api/notifications/me`) con su propio estado de lectura
(`PATCH /api/notifications/:id/read`). No hay estado compartido entre destinatarios.

No es un servicio de email ni de push. Persiste en la base y nada más.

> **No lo uses para la cancelación de una clase.** `PATCH /api/classes/:id/cancel` ya genera
> automáticamente el aviso «Clase cancelada» para cada miembro con reserva activa. Si además llamás a
> este endpoint, el miembro recibe la notificación duplicada.

---

## 2. Autorización

| Rol | Puede notificar a |
| --- | --- |
| `RECEPCION_ADMIN` | Cualquier usuario activo |
| `ENTRENADOR` | Solo miembros con vínculo: reserva en una clase suya, sesión personal suya o rutina que él asignó |

Si un `ENTRENADOR` incluye un `recipientId` fuera de su alcance, la respuesta es `403` y **no se
crea ninguna** notificación (el envío es todo o nada).

El token va en `Authorization: Bearer <JWT>`, igual que en el resto de la API.

---

## 3. Request

```json
{
  "recipientIds": ["9f0f5f8e-1f0e-4b0e-9c3f-1a2b3c4d5e6f"],
  "title": "Membresía por vencer",
  "message": "Tu membresía vence en 3 días.",
  "sourceModule": "MEMBRESIA",
  "referenceId": "b3c2a1d0-0000-4000-8000-000000000001"
}
```

| Campo | Tipo | Obligatorio | Regla |
| --- | --- | --- | --- |
| `recipientIds` | `string[]` | ✅ | 1 a 50 UUID v4. Los repetidos se deduplican |
| `title` | `string` | ✅ | 1 a 100 caracteres. Se recorta; solo espacios → `400` |
| `message` | `string` | ✅ | 1 a 500 caracteres. Se recorta; solo espacios → `400` |
| `sourceModule` | `string` | ✅ | `MEMBRESIA` · `CLASES` · `PAGOS` · `EQUIPAMIENTO` |
| `referenceId` | `string` | — | Máx. 100 caracteres. ID del recurso relacionado |

```ts
export type NotificationSource =
  | 'MEMBRESIA'
  | 'CLASES'
  | 'PAGOS'
  | 'EQUIPAMIENTO';

export interface SendNotificationInput {
  recipientIds: string[];
  title: string;
  message: string;
  sourceModule: NotificationSource;
  referenceId?: string;
}
```

### ⚠️ El cuerpo no admite campos extra

El `ValidationPipe` global corre con `forbidNonWhitelisted: true`. Cualquier propiedad que no esté en
la tabla anterior (`recipients`, `emails`, `body`, `type`, …) hace que todo el envío falle con `400`.

Esto es distinto de un `400` por formato: el mensaje de error lista los campos sobrantes. Si ves
`property X should not exist`, el adaptador está mandando de más.

### `referenceId` — para qué sirve

Viaja a la notificación y vuelve en `GET /api/notifications/me`. Sirve para que la campana pueda
navegar al recurso relacionado:

| `sourceModule` | `referenceId` apunta a |
| --- | --- |
| `MEMBRESIA` | ID de la membresía |
| `CLASES` | ID de la clase (`ClassSession`) o de la sesión personal |
| `PAGOS` | ID del cobro |
| `EQUIPAMIENTO` | ID de la máquina |

---

## 4. Response `201`

```json
{
  "sent": 2,
  "notificationIds": [
    "5c1e9a4b-0000-4000-8000-000000000001",
    "5c1e9a4b-0000-4000-8000-000000000002"
  ]
}
```

```ts
export interface SendNotificationResponse {
  sent: number;
  notificationIds: string[];
}
```

`sent` es la cantidad de filas creadas (una por destinatario, ya deduplicado). Para la UI alcanza con
mostrar «Aviso enviado a N personas»; `notificationIds` está por si necesitás trazabilidad.

---

## 5. Errores

| Código | Cuándo | Qué mostrar |
| --- | --- | --- |
| `400` | Sin destinatarios, más de 50, título/mensaje vacío o > límite, `sourceModule` inválido, campo extra | El mensaje del backend (lista los campos) |
| `401` | Token ausente o expirado | «Tu sesión expiró. Vuelve a iniciar sesión.» |
| `403` | El `ENTRENADOR` incluyó a alguien fuera de su alcance | «Solo puedes notificar a los miembros que tienes asignados» |
| `404` | Algún `recipientId` no existe o está inactivo | «Algún destinatario ya no está disponible». **No hay envío parcial**: no se creó ninguna notificación |

Forma del error (la misma de toda la API):

```json
{ "statusCode": 403, "message": "Solo puedes notificar a los miembros que tienes asignados", "error": "Forbidden" }
```

Con `400` de validación, `message` es un **array** de strings.

---

## 6. De dónde salen los `recipientIds`

- **`RECEPCION_ADMIN`:** `GET /api/users?role=MIEMBRO&search=<texto>` devuelve `{ data: [{ id, email, role, name, cardNumber }] }`.
- **`ENTRENADOR`:** el mismo `GET /api/users` está permitido desde este turno, pero devuelve una vista
  acotada `{ data: [{ id, name, cardNumber }] }` (sin email). El backend ignora `role` para este rol y
  siempre lista miembros. La pantalla `/trainer/routines` ya puede usarlo en lugar de pedir el ID a mano.

El `id` es el mismo que viaja en el JWT (`sub`) y en las notificaciones.

---

## 7. Ejemplos

### curl

```bash
curl -s -X POST "$API_URL/api/notifications/send" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "recipientIds": ["9f0f5f8e-1f0e-4b0e-9c3f-1a2b3c4d5e6f"],
        "title": "Membresía por vencer",
        "message": "Tu membresía vence en 3 días.",
        "sourceModule": "MEMBRESIA"
      }'
```

### Server Action (mismo patrón que `lib/api/*`)

El proyecto no llama a `apiFetch` desde las páginas: cada dominio tiene su adaptador en `lib/api/`.
Para este caso, un `lib/api/notifications.ts` nuevo:

```ts
// lib/api/notifications.ts
import { apiFetch } from './client'; // el helper que ya usa el resto de lib/api
import type { SendNotificationInput, SendNotificationResponse } from '@/lib/types/notifications';

export function sendNotification(input: SendNotificationInput) {
  return apiFetch<SendNotificationResponse>('/api/notifications/send', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
```

```ts
// app/actions/notifications.ts
'use server';

import { hasAnyRole } from '@/lib/auth-guard';
import { sendNotification } from '@/lib/api/notifications';
import { getSessionData } from '@/lib/session';

export async function sendNotificationAction(input: SendNotificationInput) {
  const session = await getSessionData();
  // La acción es alcanzable por POST directo: el rol se valida acá, además del guard de UI.
  if (!hasAnyRole(session, ['RECEPCION_ADMIN', 'ENTRENADOR'])) {
    return { ok: false as const, message: 'No tienes permiso para enviar avisos' };
  }

  const result = await sendNotification(input);
  return { ok: true as const, sent: result.sent };
}
```

Reglas del proyecto que también aplican acá:

- La ruta **no** se escribe a mano en la página: va en `lib/api-routes.ts` y la consume el adaptador.
- La llamada va **desde el servidor de Next.js**, con `Authorization` y `Content-Type: application/json`.
- Si un campo obligatorio falta en la respuesta (`sent`, `notificationIds`), el adaptador lanza
  `ContractError`; no inventes valores.
- `message` del error puede ser `string` **o** `string[]` (validación); normalizalo antes de pintarlo.

### Validación en el formulario (espejo del backend)

| Campo | En la UI |
| --- | --- |
| Destinatarios | Al menos 1, máximo 50, sin duplicados (o deduplicá antes de enviar) |
| Título | Requerido, máx. 100; `trim()` antes de validar |
| Mensaje | Requerido, máx. 500; `trim()` antes de validar |
| Módulo | Select con los 4 valores exactos, sensible a mayúsculas |

---

## 8. Casos de uso sugeridos

| Pantalla | `sourceModule` | `referenceId` |
| --- | --- | --- |
| Recordatorio de vencimiento de membresía | `MEMBRESIA` | ID de la membresía |
| Aviso de cobro pendiente | `PAGOS` | ID del cobro |
| Máquina fuera de servicio | `EQUIPAMIENTO` | ID de la máquina |
| Recordatorio de clase (entrenador → sus alumnos) | `CLASES` | ID de la clase |

Para avisos masivos (> 50 personas), partí en lotes: el límite es por request, no por día.

---

## 9. Checklist antes de dar la integración por cerrada

1. El adaptador manda **exactamente** los 5 campos (sin `type`, sin `recipients`, sin `emails`).
2. `sourceModule` es uno de los 4 literales, con mayúsculas.
3. Un `403` muestra el mensaje del backend, no un texto genérico.
4. Un `404` no deja la pantalla en estado «enviado»: no se creó nada.
5. La cancelación de clase **no** llama a este endpoint (el backend ya avisa).
6. Después de enviar, la campana (`GET /api/notifications/me`) del destinatario refleja
   `unreadCount` incrementado.
