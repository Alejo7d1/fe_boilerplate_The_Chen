// lib/api-routes.ts
// Único punto de definición de las rutas del backend.
// Ninguna acción, página o componente debe escribir rutas a mano.

export const API_ROUTES = {
  auth: {
    login: "/api/auth/login",
    register: "/api/users",
  },
  memberships: {
    me: "/api/memberships/me",
    purchase: "/api/memberships/purchase",
  },
  plans: {
    list: "/api/plans",
    create: "/api/plans",
    update: (id: string) => `/api/plans/${id}` as const,
    toggleStatus: (id: string) => `/api/plans/${id}/status` as const,
  },
  classes: {
    sessions: "/api/class-sessions",
    create: "/api/classes",
    update: (id: string) => `/api/classes/${id}` as const,
    cancel: (id: string) => `/api/classes/${id}/cancel` as const,
    reserve: (sessionId: string) => `/api/class-sessions/${sessionId}/reserve` as const,
  },
  reservations: {
    me: "/api/reservations/me",
    cancel: (id: string) => `/api/reservations/${id}` as const,
  },
  trainers: {
    list: "/api/trainers",
    availability: (id: string) => `/api/trainers/${id}/availability` as const,
    createAvailability: "/api/trainer-availability",
    bookPersonalSession: "/api/personal-sessions",
  },
  access: {
    checkIn: "/api/access/check-in",
  },
  billing: {
    pendingCharges: "/api/charges/pending",
    processPayment: "/api/payments/process",
  },
  notifications: {
    send: "/api/notifications/send",
    me: "/api/notifications/me",
    markAsRead: (id: string) => `/api/notifications/${id}/read` as const,
  },
  training: {
    assignRoutine: "/api/routines",
    recordProgress: "/api/progress",
  },
  equipment: {
    list: "/api/equipment",
    updateStatus: (id: string) => `/api/equipment/${id}/status` as const,
  },
  reviews: {
    create: "/api/reviews",
    analytics: "/api/reviews/analytics",
  },
  reports: {
    occupancy: "/api/reports/occupancy",
    financial: "/api/reports/financial",
  },
} as const;

export type ApiRoutes = typeof API_ROUTES;