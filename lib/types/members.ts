// lib/types/members.ts
// H2 · Identificación del miembro que recibe la compra o renovación.

import type { EntityId } from "@/lib/types/common";

/**
 * Resumen de un miembro (`GET /api/users`).
 * El backend devuelve también `cardNumber` y `role`.
 */
export interface MemberSummary {
  id: EntityId;
  name: string;
  email?: string;
  cardNumber?: string;
  role?: string;
}

/** Alta de miembro (`POST /api/users`). El backend asigna rol `MIEMBRO` y el carné. */
export interface CreateMemberRequest {
  name: string;
  email: string;
  password: string;
}
