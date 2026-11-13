// lib/types/plans.ts
// H3 · Definición y administración de planes.
// Contrato pendiente de confirmar con Backend: ver docs/api-contracts.md.

import type { EntityId } from "@/lib/types/common";

/**
 * Plan de membresía (contrato de `GET /api/plans`).
 * El backend expone `active: boolean`, `durationDays` y `classCount`.
 */
export interface MembershipPlan {
  id: EntityId;
  name: string;
  /** Tipo comercial del plan (`MENSUAL`, `CLASES_SUELTAS`, ...). */
  type?: string;
  price: number;
  durationDays: number;
  /** Clases incluidas; `null` cuando el plan es ilimitado. */
  classesIncluded: number | null;
  benefits?: string;
  active: boolean;
}

export interface CreatePlanRequest {
  name: string;
  price: number;
  durationDays: number;
  classesIncluded: number | null;
}

/** El endpoint de edición es `PUT`, por lo que envía el plan completo. */
export type UpdatePlanRequest = CreatePlanRequest;
