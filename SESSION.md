# Plan de ejecución — Sprint activo de Frontend

> Este archivo resume el Jira del Sprint: alcance, historias, rutas y orden de trabajo. No hace falta volver a consultar Jira para eso.

## Alcance confirmado

El plan cubre exclusivamente las subtareas de Frontend asignadas a **Alejandro Orellana** dentro de las historias del Sprint activo de Jira (**TSK Sprint 2**). Se identificaron 15 subtareas pendientes o en curso, agrupadas por historia:

- **H1 — Consulta del estado de membresía:** `TSK-100` / `FE-1.1`.
- **H2 — Compra o renovación de membresía:** `TSK-107` / `FE-2.1`, `TSK-103` / `FE-2.2`.
- **H3 — Administración de planes:** `TSK-108` / `FE-3.1`, `TSK-112` / `FE-3.2`.
- **H4 — Reserva de cupo en una clase (retrabajo por reestructuración):** `TSK-35` / `FE-4.1`, `TSK-36` / `FE-4.2`.
- **H5 — Cancelación de reserva:** `TSK-126` / `FE-5.1`, `TSK-127` / `FE-5.2`.
- **H6 — Administración de clases:** `TSK-131` / `FE-6.1`, `TSK-130` / `FE-6.2`.
- **H7 — Disponibilidad del entrenador:** `TSK-60` / `FE-7.1`, `TSK-61` / `FE-7.2`.
- **H8 — Agendamiento de sesión personal:** `TSK-65` / `FE-8.1`, `TSK-66` / `FE-8.2`.

No se incluyen tareas de Backend, Base de Datos ni QA. Aunque Jira marca H4 y sus subtareas FE como finalizadas y actualmente las muestra asignadas a otra persona, se incluye explícitamente como retrabajo/revalidación porque la reestructuración reportada indica que su implementación no está terminada. Su asignación y estado deben corregirse en Jira durante la ejecución.

## Diagnóstico técnico del repositorio

El frontend tiene autenticación funcional, cliente HTTP base en [`lib/api.ts`](./lib/api.ts), shell autenticado con sidebar por rol, tipos de dominio base creados y un Panel informativo en `/`. No hay pruebas automatizadas configuradas (decisión de Fase 0). La implementación debe preservar el patrón de App Router, Server Actions, componentes shadcn/ui, rutas centralizadas y manejo de sesión existente.

## Orden de ejecución propuesto

### Fase 0 — Base transversal y desbloqueos ✅ Completada

1. Revisar contratos de API y confirmar los endpoints de cada dependencia BE antes de construir pantallas.
2. Completar tipos compartidos y rutas API para membresías, planes, pagos, reservas, clases, entrenadores y disponibilidad.
3. Crear el shell autenticado del dashboard, navegación por rol y componentes compartidos para estados de carga, error, vacío, confirmación y tablas responsivas.
4. Añadir una estrategia mínima de pruebas de componentes/integración y una matriz de respuestas HTTP (`201`, `400`, `403`, `404`, `409`).

**Entregado**

| Artefacto | Ubicación |
| --- | --- |
| Mapa de rutas de páginas (inglés) y tabla de endpoints con roles | [`docs/api-contracts.md`](./docs/api-contracts.md) |
| Estrategia de pruebas y matriz HTTP (sin dependencias instaladas) | [`docs/testing-strategy.md`](./docs/testing-strategy.md) |
| Tipos de dominio | [`lib/types/`](./lib/types) (`common`, `memberships`, `plans`, `classes`, `trainers`, `payments`) |
| Shell autenticado (sidebar por rol + header con tema y logout) | [`app/(app)/layout.tsx`](<./app/(app)/layout.tsx>), [`components/app-sidebar.tsx`](./components/app-sidebar.tsx), [`components/app-header.tsx`](./components/app-header.tsx) |
| Navegación por rol | [`lib/navigation.ts`](./lib/navigation.ts) — historias no implementadas aparecen deshabilitadas con «Pronto» |
| Estados compartidos | [`components/states/`](./components/states), [`components/data-table.tsx`](./components/data-table.tsx), [`components/confirm-dialog.tsx`](./components/confirm-dialog.tsx) |

Decisiones tomadas: rutas de página en inglés, sidebar de shadcn/ui, solo el home existe (el resto de enlaces deshabilitados), rol leído del claim `role` del JWT sin asumir uno por defecto, y pruebas solo documentadas.

### Fase 1 — Flujos de membresías y planes

1. `FE-1.1`: pantalla de estado de membresía con plan, estado, vencimiento y clases restantes; cubrir membresías vigentes/vencidas y estados de carga.
2. `FE-3.1`: pantalla administrativa de planes con listado, filtros/estado y acciones disponibles.
3. `FE-3.2`: formulario y acciones de creación/edición de planes con validación y feedback.
4. `FE-2.1`: formulario de compra/renovación con selección de plan, resumen y validaciones.
5. `FE-2.2`: integración del flujo de pago/renovación, bloqueo de doble envío y manejo de éxito/error.

### Fase 2 — Reserva de clases, clases y cancelaciones

1. **Reabrir y revalidar H4:** revisar el alcance posterior a la reestructuración y actualizar la asignación/estado de `TSK-35` y `TSK-36`.
2. `FE-4.1`: vista `/clases/reservar` con pestañas de los próximos 7 días, tarjetas de clase, entrenador, horario y cupos libres.
3. `FE-4.2`: integración de reserva, estados de carga, bloqueo de doble envío, actualización del cupo y errores `403/409`.
4. `FE-6.1`: pantalla administrativa de clases con listado, filtros y acciones.
5. `FE-6.2`: integración de edición y cancelación de clases con confirmación y actualización del listado.
6. `FE-5.1`: pantalla de mis reservas y acción de cancelación.
7. `FE-5.2`: integración y confirmación de cancelación, incluyendo errores de conflicto o reserva no disponible.

### Fase 3 — Disponibilidad y agendamiento personal

1. `FE-7.1`: vista `/entrenador/disponibilidad` con selector de fecha, horario de 06:00 a 21:00 y tabla de bloques.
2. `FE-7.2`: integración de `POST/GET /api/trainer-availability`, estados de carga, errores `400/409` y actualización sin recarga.
3. `FE-8.1`: vista `/entrenadores/agendar` con selector de entrenador, cuadrícula de 14 días y modal de confirmación.
4. `FE-8.2`: integración de entrenadores, disponibilidad y `POST /api/personal-sessions`, manejando `403` por membresía vencida, `409` por conflicto y retiro del bloque reservado.

## Dependencias y reglas de priorización

- Cada subtarea de integración (`FE-2.2`, `FE-3.2`, `FE-5.2`, `FE-6.2`, `FE-7.2`, `FE-8.2`) depende de su pantalla base y del contrato Backend correspondiente.
- Priorizar primero el trabajo que desbloquea más historias: tipos/rutas API, shell del dashboard y componentes de estados.
- No iniciar una integración hasta verificar el contrato del endpoint y sus códigos de error.
- Las subtareas con estado `Por hacer` deben pasar a diseño/pantalla antes de las que ya están `PLANIFICADO`; las integraciones se ejecutan inmediatamente después de su pantalla padre.
- El alcance funcional se limita a las rutas, roles, endpoints y criterios de aceptación descritos en Jira; no se amplían módulos no presentes en el Sprint.

## Criterios de terminado por subtarea

- Criterios de aceptación de Jira implementados y verificables.
- Diseño responsive en móvil y escritorio.
- Estados de carga, vacío, éxito y error explícitos.
- Validación de formularios y prevención de envíos duplicados.
- Tipos TypeScript sin `any` innecesarios.
- `npm run lint` y `npm run build` exitosos.
- Pruebas de integración para los flujos que consumen API.
- Revisión visual y PR aprobado por un compañero.

## Convenciones de trabajo

- Estamos en **fase de desarrollo**: los errores menores (warnings, lints de código generado, detalles cosméticos) se ignoran y se parchan después. No se invierte tiempo en ellos.
- Fuente de alcance: este archivo. Fuente de contratos: [`lib/api-routes.ts`](./lib/api-routes.ts) y [`docs/api-contracts.md`](./docs/api-contracts.md).
- Los huecos de contrato se marcan con `TODO(contract)` en los tipos; no se rellenan con valores por defecto.
- Validación mínima antes de dar una tarea por terminada: `npm run build` y `npm run lint`.

## Riesgos y decisiones

- El repositorio no contiene aún las pantallas de negocio, por lo que habrá trabajo transversal antes de cerrar las subtareas individuales.
- Los contratos Backend son dependencias externas; cualquier divergencia debe registrarse y bloquear únicamente la integración afectada, no ocultarse con valores por defecto.
- Los huecos de contrato abiertos están listados en [`docs/api-contracts.md`](./docs/api-contracts.md).
