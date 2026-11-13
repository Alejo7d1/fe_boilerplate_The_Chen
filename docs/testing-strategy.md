# Estrategia de pruebas del frontend

## Estado actual

El proyecto **no tiene herramientas de pruebas instaladas**. En la Fase 0 la estrategia se documenta únicamente; no se agregaron dependencias ni scripts.

Los criterios de terminado de cada subtarea del sprint exigen pruebas de integración del componente con la API, por lo que la instalación se hará al iniciar la primera historia que consuma endpoints.

## Stack propuesto

| Paquete | Uso |
| --- | --- |
| `vitest` | Runner y aserciones |
| `jsdom` | Entorno DOM |
| `@vitejs/plugin-react` | Transformación JSX |
| `vite-tsconfig-paths` | Resolución del alias `@/*` |
| `@testing-library/react` | Render de componentes |
| `@testing-library/user-event` | Interacción de usuario |
| `@testing-library/jest-dom` | Matchers de DOM |

Scripts previstos en [`package.json`](../package.json):

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

## Niveles de prueba

| Nivel | Qué cubre | Dónde |
| --- | --- | --- |
| Unidad | `getNavItems` por rol, helpers de formato y validaciones puras | `lib/**/*.test.ts` |
| Componente | Estados de carga, vacío, error y éxito de formularios y listados | junto al componente |
| Integración | Server Actions y componentes que consumen `apiFetch`, con `fetch` simulado | `app/**/*.test.tsx` |
| Humo manual | Navegación por rol y responsive en móvil/escritorio | por PR |

## Matriz de respuestas HTTP

La misma matriz debe cubrirse en las pruebas de integración de cada historia.

| Código | Escenario | Historias | Comportamiento esperado en UI |
| --- | --- | --- | --- |
| `201` | Reserva creada, bloque de disponibilidad registrado, sesión personal agendada, plan creado | H2, H3, H4, H6, H7, H8 | Actualiza el listado o la cuadrícula sin recargar y muestra mensaje de éxito |
| `400` | Datos inválidos: fecha pasada, cupo fuera de rango, tarjeta rechazada | H2, H3, H6, H7, H8 | Mensaje claro en el formulario y conserva lo ingresado |
| `401` | Token ausente o expirado | Todas | Sin cookie o con JWT vencido, el proxy redirige a `/login` y borra la cookie. Si el backend responde `401` con un token aún vigente, la pantalla muestra una alerta con el mensaje del backend (no redirige, para no romper el flujo). |
| `403` | Rol no autorizado, membresía vencida, recurso de otro usuario | H1, H2, H4, H5, H6, H7, H8 | Alerta con el mensaje del backend; no rompe la pantalla |
| `404` | Reserva o clase inexistente al cancelar | H5, H6 | Mensaje de no encontrado y refresco del listado |
| `409` | Cupo agotado, reserva duplicada, bloque cruzado, pago ya realizado, conflicto de horario | H2, H4, H5, H6, H7, H8 | Alerta con el mensaje del backend y refresco del estado |

Reglas transversales:

- El botón que dispara la solicitud queda deshabilitado mientras la petición está en curso (sin doble envío).
- Los mensajes de error provienen de `ApiError` ([`lib/api.ts`](../lib/api.ts)) y no se reemplazan por textos genéricos cuando el backend envía uno.
- Todo estado de carga usa `Spinner`; todo error de formulario usa `Alert` con `variant="destructive"`.

## Estados obligatorios por pantalla

Cada pantalla de historia debe implementar y probar: **cargando**, **vacío**, **éxito** y **error**, usando los componentes compartidos:

| Componente | Archivo |
| --- | --- |
| `LoadingState` | [`components/states/loading-state.tsx`](../components/states/loading-state.tsx) |
| `EmptyState` | [`components/states/empty-state.tsx`](../components/states/empty-state.tsx) |
| `ErrorState` | [`components/states/error-state.tsx`](../components/states/error-state.tsx) |
| `DataTable` (responsive) | [`components/data-table.tsx`](../components/data-table.tsx) |
| `ConfirmDialog` | [`components/confirm-dialog.tsx`](../components/confirm-dialog.tsx) |
