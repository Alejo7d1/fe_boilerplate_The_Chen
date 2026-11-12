// lib/api-routes.ts
// Único punto de definición de las rutas del backend.
// Ninguna acción, página o componente debe escribir rutas a mano.

export const API_ROUTES = {
  auth: {
    login: "/api/auth/login",
  },
} as const satisfies Record<string, Record<string, `/${string}`>>;

export type ApiRoutes = typeof API_ROUTES;
