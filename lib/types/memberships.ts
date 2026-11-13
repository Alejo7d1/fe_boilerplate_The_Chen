// lib/types/memberships.ts
// H1 · Consulta del estado de membresía.
// H2 · Registro de compra o renovación de membresía.
// Contrato pendiente de confirmar con Backend: ver docs/api-contracts.md.

import type { EntityId, IsoDate } from "@/lib/types/common";

/**
 * Membresía del miembro autenticado (contrato de `GET /api/memberships/me`).
 * El backend la devuelve plana: `planId` + `planName` resuelto.
 */
export interface Membership {
  id: EntityId;
  planId: EntityId;
  planName: string;
  /** Valores observados: `Vigente`, `Vencida`, `Sin Membresía`. */
  status: string;
  /** Fecha de vencimiento en formato `YYYY-MM-DD`. */
  endDate: IsoDate;
  /** Clases restantes; `null` cuando el plan es ilimitado. */
  remainingClasses: number | null;
}

/** Solicitud de compra o renovación. El endpoint es exclusivo de `RECEPCION_ADMIN`. */
export interface PurchaseMembershipRequest {
  memberId: EntityId;
  planId: EntityId;
}
