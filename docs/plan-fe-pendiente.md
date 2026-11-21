# Plan · Frontend pendiente (H9 – H21)

Estado del trabajo sobre el backlog `TSK` (proyecto The_Chen) para cerrar todo el FE.
Última actualización: 2026-11-20.

## Punto de partida

La rama de trabajo es **`dev`** (commit `5d03f2f`). Ahí ya están mergeadas:

| PR | Contenido | Épica |
| --- | --- | --- |
| #4 | Vitest + corrección de mensajes de error del backend | base transversal (ya eliminada) |
| #5 | `/admin/check-in` | **EP4** · H9 |
| #6 | `/admin/equipment` y `/equipment` | **EP7** · H14 + H15 |

`dev` verificado: `npm test` → 9/9 en 3 archivos · `npm run build` → ✓.

## Reglas de trabajo

1. **Toda rama nace de `dev`** con el patrón `feature/ep<N>-<slug>`.
2. **Un commit por épica**. No un commit por historia.
3. **Confirmar con el usuario antes de cada commit** (no asumir).
4. **Ramas independientes**: ninguna épica se apila sobre otra; todas parten de `dev`.
5. **No se inventan valores**. Si un campo obligatorio falta o un estado no está en el
   catálogo, se lanza `ContractError` ([`lib/api/normalize.ts`](../lib/api/normalize.ts)).
6. **Rutas siempre desde** [`lib/api-routes.ts`](../lib/api-routes.ts); nunca escritas a mano.
7. **Docs por épica** para no generar conflictos: `docs/api-contracts-ep<N>-<slug>.md`.
   El documento principal [`docs/api-contracts.md`](./api-contracts.md) no se toca desde las épicas.
8. **Jira**: el conector no permite borrar incidencias. Las subtareas redundantes se anotan
   en `docs/jira-borrar-ep<N>.md` para que se borren a mano.

## Arquitectura de una pantalla

Cada épica sigue el mismo camino:

```
lib/types/<dominio>.ts      → tipos del contrato
lib/api/<dominio>.ts        → adaptador con normalize.ts (tolera nombres alternativos)
app/actions/<dominio>.ts    → "use server": hasAnyRole + validación + revalidatePath
app/(app)/<ruta>/page.tsx   → requireRole + carga en servidor + estados
app/(app)/<ruta>/loading.tsx
components/<dominio>/*      → componentes cliente
```

Estados obligatorios: **cargando**, **vacío**, **éxito**, **error**, con los componentes de
[`components/states/`](../components/states/).

## Verificación obligatoria por épica

```bash
npm test          # vitest
npm run build     # next build (incluye type-check)
```

Y prueba manual contra la **API de pruebas** en `http://localhost:8000`.

Credenciales de prueba:

| Rol | Email | Password |
| --- | --- | --- |
| `RECEPCION_ADMIN` | `admin@thechen.com` | `admin123` |
| `RECEPCION_ADMIN` | `recepcion@thechen.com` | `recepcion123` |
| `ENTRENADOR` | `entrenador@thechen.com` | `trainer123` |
| `MIEMBRO` (vigente) | `miembro.activo@thechen.com` | `member123` |
| `MIEMBRO` (vencido) | `miembro.vencido@thechen.com` | `expired123` |

Los datos se reinician al reiniciar el proceso de la API.

---

# Épicas pendientes

## EP5 · Pagos y facturación — `feature/ep5-pagos-facturacion`

> **Estado:** implementado y probado contra la API de pruebas el 2026-11-20. Contrato en
> [`docs/api-contracts-ep5-pagos.md`](./api-contracts-ep5-pagos.md). La API de pruebas
> ignora `limit`, `startDate`, `endDate` y `memberId` en `/api/charges/pending`; la UI
> envía los parámetros del contrato y los aplicará cuando el backend los soporte.

| Historia | Jira | Ruta | Rol |
| --- | --- | --- | --- |
| H10 · Cobro y comprobante | TSK-30 | `/payments/process` | `MIEMBRO` |
| H11 · Cobros pendientes | TSK-29 | `/admin/pending-charges` | `RECEPCION_ADMIN` |

**H10** · `POST /api/payments/process` con `{ chargeId, cardNumber, expMonth, expYear, cvv }`.
Formulario con validación en vivo (titular 3-100, tarjeta 16 dígitos, `MM/YY`, CVV 3-4).
Al `200` se oculta el formulario y se muestra el comprobante con `receiptNumber`
(`REC-XXXXX`), monto, fecha, concepto y `last4`, con opción de imprimir.
El `chargeId` llega por query string; sin él, estado vacío explicativo.

**H11** · `GET /api/charges/pending?page=&limit=&startDate=&endDate=&memberId=`.
Buscador por nombre/carné (vía `GET /api/users?role=MIEMBRO&search=`), rango de fechas,
tabla paginada de 10. Vacío exacto: «No hay pagos pendientes registrados».

Errores de la API de pruebas: `403` cobro ajeno · `409` ya pagado · `400` tarjeta inválida ·
`400` «Fondos insuficientes» si la tarjeta termina en `0002`.

Subtarea a borrar en Jira: **TSK-84** (FE-10.2, absorbida por FE-10.1).

## EP6 · Planes de entrenamiento y seguimiento — `feature/ep6-planes-entrenamiento`

> **Estado:** implementado y probado contra la API de pruebas el 2026-11-20. Contrato en
> [`docs/api-contracts-ep6-training.md`](./api-contracts-ep6-training.md). Se confirman los
> dos bloqueos previstos: el entrenador recibe `403` en `GET /api/users` (selector con
> captura manual del identificador) y no existe `GET` del historial de progreso (`404` se
> trata como «sin historial», con el gráfico SVG y la tabla listos para cuando exista).
>
> **Seguimiento en Jira:** **TSK-136 · BE-12.2** — autorizar
> `GET /api/users?role=MIEMBRO&search=` al rol `ENTRENADOR` (bloquea a TSK-91 · FE-12.1).
> Al estar disponible se retira la captura manual del selector de clientes.

| Historia | Jira | Ruta | Rol |
| --- | --- | --- | --- |
| H12 · Asignación de rutinas | TSK-31 | `/trainer/routines` | `ENTRENADOR` |
| H13 · Progreso físico | TSK-32 | `/progress/new` · `/progress` | `MIEMBRO` |

**H12** · `POST /api/routines` con `{ memberId, exercises: [{ name, series, reps }] }`.
Selector de cliente + filas dinámicas de ejercicios. `400` si no hay ejercicios.

> **Bloqueo de backend:** no existe endpoint que liste los clientes activos del entrenador.
> El selector usa `GET /api/users?role=MIEMBRO&search=` y, si responde `403`, la pantalla lo
> informa sin romperse.

**H13** · `POST /api/progress` con `{ date, weight, waist, chest, strengthMarks? }`.
Rangos: peso 20–500 kg, cintura/pecho 30–300 cm, fecha ≤ hoy.

> **Bloqueo de backend:** no existe `GET` del histórico de progreso. La vista `/progress`
> se entrega con estado vacío «Aún no hay registros» y el gráfico se dibuja con SVG propio
> (no hay librería de gráficos instalada).

## EP8 · Reseñas y calificaciones — `feature/ep8-resenas-calificaciones`

| Historia | Jira | Ruta | Rol |
| --- | --- | --- | --- |
| H16 · Calificar clases | TSK-22 | `/reviews` | `MIEMBRO` |
| H17 · Reporte de promedios | TSK-23 | `/admin/reports/reviews` | `RECEPCION_ADMIN` |

**H16** · `POST /api/reviews` con `{ sessionId, rating, comment }`. Estrellas 1–5, comentario
opcional ≤ 300 caracteres con contador. `409` si ya calificó; `403` sin asistencia o fuera
de plazo (7 días). Tras `201` la tarjeta pasa a «Calificada» y no permite reenvío.

> **Bloqueo de backend:** no hay `GET` de sesiones personales, así que solo se listan clases
> grupales finalizadas (cruce de `GET /api/reservations/me` + `GET /api/class-sessions`).

**H17** · `GET /api/reviews/analytics?startDate&endDate&trainerId&classId`.

> **Ojo con el contrato:** `BE-17.1` documenta `{ byTrainer, byClass }`, pero la API de
> pruebas devuelve `{ data: [{ targetType, targetId, targetName, average, totalReviews }] }`.
> El adaptador debe tolerar ambas formas. `average: null` se muestra como «Sin calificaciones».

Subtarea a borrar en Jira: **TSK-51** (FE-16.2) · **TSK-56** (FE-17.2).

## EP9 · Servicio centralizado de notificaciones — `feature/ep9-notificaciones`

| Historia | Jira | Ruta | Rol |
| --- | --- | --- | --- |
| H19 · Centro de notificaciones | TSK-5 | campana en el header | los 3 roles |

H18 (TSK-4) es solo backend: no lleva FE.

`GET /api/notifications/me?page=` → `{ data: [...], unreadCount }` · 10 por página.
`PATCH /api/notifications/:id/read` marca una.

> **Sin `read-all`:** `FE-19.2` pide «marcar todas como leídas», pero ese endpoint no existe
> y `BE-19.1` dice explícitamente que no forma parte del contrato. Se implementa iterando
> los `PATCH` de las no leídas.
>
> La API de pruebas devuelve la notificación completa en el `PATCH` (no
> `{ notificationId, isRead, unreadCount }`) e ignora la paginación.

Subtarea a borrar en Jira: **TSK-79** (FE-19.2).

## EP10 · Reportes y analítica administrativa — `feature/ep10-reportes-analitica`

| Historia | Jira | Ruta | Rol |
| --- | --- | --- | --- |
| H20 · Ingresos y renovación | TSK-13 | `/admin/reports/revenue` | `RECEPCION_ADMIN` |
| H21 · Ocupación de clases | TSK-17 | `/admin/reports/occupancy` | `RECEPCION_ADMIN` |

**H20** · `GET /api/reports/financial?startDate&endDate` (fechas obligatorias).

> **Ojo con el contrato:** `BE-20.1` propone `{ period, totalIncome, paymentCount, renewals,
> renewalRate }`, pero la API de pruebas devuelve `{ totalRevenue, renovationRate }`.
> El adaptador debe tolerar ambos nombres.

**H21** · `GET /api/reports/occupancy?startDate&endDate&classId`.

> **Ojo con el contrato:** `BE-21.1` propone filas con `className`, `date`, `startTime`,
> `maxCapacity`, `reservedCount`, `availableSpots`, `occupancyRate`; la API de pruebas solo
> devuelve `{ className, occupancyPercentage }`. El adaptador debe mostrar lo que exista y
> no inventar los campos ausentes.

Subtareas a borrar en Jira: **TSK-116** (FE-20.2) · **TSK-121** (FE-21.2).

---

# Subtareas de Jira a borrar manualmente

El conector no permite borrar incidencias. Están documentadas por épica:

| Archivo | Claves |
| --- | --- |
| [`docs/jira-borrar-ep4.md`](./jira-borrar-ep4.md) | TSK-71 |
| [`docs/jira-borrar-ep5.md`](./jira-borrar-ep5.md) | TSK-84 |
| [`docs/jira-borrar-ep7.md`](./jira-borrar-ep7.md) | TSK-41, TSK-46 |

Pendientes de anotar cuando se implementen: TSK-51, TSK-56, TSK-79, TSK-116, TSK-121.

# Correcciones de estado en Jira

`TSK-100`, `TSK-103` y `TSK-108` siguen en «EN EJECUCION» pero su FE ya está implementado
(`/membership`, `/membership/purchase`, `/admin/plans`). Deben marcarse como FINALIZADO.

# Notas heredadas del repositorio

- H14 se había marcado FINALIZADO antes de existir en `dev`; su código vivía solo en
  `feature/machinery-states` (estructura vieja). Se rehizo en EP7.
- FE-10.1 (pasarela de pago) estaba marcada FINALIZADO sin estar en el repo; se rehace en EP5.
