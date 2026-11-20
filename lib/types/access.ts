// lib/types/access.ts
// H9 · Registro de ingreso de miembros.

/** `POST /api/access/check-in` */
export interface CheckInRequest {
  /** Carné exacto o nombre completo del miembro. */
  cardNumber: string;
  allowException: boolean;
}

/** Resultados que devuelve el backend. */
export type CheckInOutcome = "Permitido" | "Excepcion";

export interface CheckInResult {
  accessId: string;
  memberName: string;
  result: CheckInOutcome;
  timestamp: string;
}
