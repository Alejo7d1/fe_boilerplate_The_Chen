# Contrato FE · EP9 Notificaciones

## Centro de notificaciones

- `GET /api/notifications/me?page=<n>` devuelve `{ data, unreadCount }`.
- `data` contiene como máximo 10 notificaciones por página.
- Cada notificación requiere `id`, `title`, `message`, `createdAt` e `isRead`.
- `PATCH /api/notifications/:id/read` marca una notificación como leída y devuelve
  la notificación actualizada.
- No existe endpoint de lectura masiva. La UI ejecuta un `PATCH` por cada
  notificación no leída.

El adaptador admite nombres equivalentes documentados por el backend
(`created_at`, `subject`, `body`, etc.) sin inventar campos obligatorios.
