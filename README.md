# The Chen · Fitness club

Frontend del sistema de gestión de **The Chen**, *Fitness club*, construido con Next.js (App Router), React 19, TypeScript y Tailwind CSS v4 sobre componentes de [shadcn/ui](https://ui.shadcn.com).

Hoy el proyecto cubre por completo el flujo de autenticación (inicio y cierre de sesión) y deja preparada la estructura para el dashboard y los módulos de negocio: clases, equipamiento, membresías, pagos y entrenadores.

## Stack

- **Next.js 16.3.6** — App Router, Server Actions y Turbopack
- **React 19.2** y **TypeScript 5**
- **Tailwind CSS v4** (`@tailwindcss/postcss`)
- **shadcn/ui** (primitivas de Radix UI) + **lucide-react** para iconografía
- **next-themes** para el tema claro/oscuro

## Requisitos

- Node.js `>= 20.9.0`
- npm
- Una API backend accesible (ver [Variables de entorno](#variables-de-entorno))

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación queda disponible en <http://localhost:3000>. Como aún no hay sesión, `proxy.ts` redirige automáticamente a `/login`.

### Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint con `eslint-config-next` |

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

| Variable | Descripción |
| --- | --- |
| `API_URL` | URL base del backend que consume [`lib/api.ts`](./lib/api.ts). Los endpoints se resuelven como rutas relativas (por ejemplo `api/auth/login`). |

## Estructura del proyecto

```text
app/
  (app)/              Shell autenticado: layout con sidebar + header y página `/`
  actions/auth.ts     Server Actions de inicio y cierre de sesión
  login/              Página y formulario de login
  layout.tsx          Layout raíz (fuentes, ThemeProvider, TooltipProvider)
  globals.css         Tailwind, tokens de tema y utilidades de shadcn/ui
components/
  ui/                 Componentes de shadcn/ui (sidebar, dialog, table, sheet, tooltip…)
  app-header.tsx      Header del dashboard: tema, usuario y cerrar sesión
  app-sidebar.tsx     Navegación por rol (cliente)
  confirm-dialog.tsx  Diálogo de confirmación con estado pendiente
  data-table.tsx      Tabla genérica y responsiva
  states/             Estados de carga, vacío y error
  theme-provider.tsx  Provider de next-themes
  theme-toggle.tsx    Interruptor claro/oscuro
docs/
  api-contracts.md    Contratos de API, rutas de páginas y huecos pendientes
  testing-strategy.md Estrategia de pruebas y matriz de respuestas HTTP
lib/
  api.ts              Cliente HTTP y `ApiError`
  api-routes.ts       Rutas del backend centralizadas (`API_ROUTES`)
  navigation.ts       Entradas del sidebar filtradas por rol
  session.ts          Cookie de sesión: crear, leer y borrar
  utils.ts            Helper `cn` para combinar clases
  types/              Tipos compartidos con el backend
hooks/
  use-mobile.ts       Detección de viewport móvil para el sidebar
proxy.ts              Protección de rutas (convención `proxy` de Next.js)
```

## Autenticación

- [`app/actions/auth.ts`](./app/actions/auth.ts) expone `login` y `logout` como Server Actions.
- `login` valida correo y contraseña, llama a `POST {API_URL}/api/auth/login` (ruta declarada en [`lib/api-routes.ts`](./lib/api-routes.ts)) y guarda el token en una cookie `httpOnly` desde [`lib/session.ts`](./lib/session.ts).
- La opción **Mantener la sesión iniciada** decide si la cookie expira a los 7 días o al cerrar el navegador.
- [`proxy.ts`](./proxy.ts) hace un chequeo optimista de la cookie: sin sesión redirige a `/login`; con sesión, visitar `/login` redirige a `/`.
- Los errores del backend se muestran en el formulario con un `Alert` destructivo, conservando el correo ingresado.

## Interfaz

El dashboard vive en el grupo de rutas [`app/(app)`](./app/(app)). Su layout valida que exista la cookie de sesión y monta un sidebar responsive ([`components/app-sidebar.tsx`](./components/app-sidebar.tsx)) con las secciones filtradas por el claim `role` del JWT, más un header con el tema y el cierre de sesión. La navegación se define en [`lib/navigation.ts`](./lib/navigation.ts): las historias aún no implementadas aparecen deshabilitadas con la etiqueta «Pronto».

Los componentes de UI viven en [`components/ui`](./components/ui) y se generan con el CLI de shadcn/ui; la configuración está en [`components.json`](./components.json).

```bash
npx shadcn@latest add <componente>
```

El tema claro/oscuro se administra con `next-themes` en [`components/theme-provider.tsx`](./components/theme-provider.tsx), con `defaultTheme="system"`; el interruptor reutilizable está en [`components/theme-toggle.tsx`](./components/theme-toggle.tsx).

## Estado actual

| Área | Estado |
| --- | --- |
| Login y logout con Server Actions y cookie `httpOnly` | ✅ Implementado |
| Protección de rutas en `proxy.ts` | ✅ Implementado |
| UI base con shadcn/ui, tema claro/oscuro y diseño responsive | ✅ Implementado |
| Shell autenticado: sidebar por rol y header | ✅ Implementado |
| Tipos de autenticación ([`lib/types/auth.ts`](./lib/types/auth.ts)) | ✅ Implementado |
| Tipos de dominio: membresías, planes, pagos, clases, reservas y entrenadores | 🚧 Base creada; faltan campos por confirmar con Backend |
| Contratos y estrategia de pruebas ([`docs/`](./docs)) | ✅ Documentados |
| Dashboard (`/`) | 🚧 Panel informativo; los módulos llegan con cada historia |
| Pruebas automatizadas | 🚧 Sin configurar (estrategia documentada) |

## Convenciones

Las decisiones de reestructuración del proyecto se documentan en [`decisiones.md`](./decisiones.md). En resumen: shadcn/ui como base de UI, rutas centralizadas y nombres de páginas y clases en inglés.

Los contratos de API, el mapa de rutas y los huecos pendientes con Backend están en [`docs/api-contracts.md`](./docs/api-contracts.md); la estrategia de pruebas y la matriz de respuestas HTTP, en [`docs/testing-strategy.md`](./docs/testing-strategy.md).

## Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de shadcn/ui](https://ui.shadcn.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
