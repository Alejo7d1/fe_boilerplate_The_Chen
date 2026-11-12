// lib/types/plans.ts
// H3 · Definición y administración de planes.
// Contrato pendiente de confirmar con Backend: ver docs/api-contracts.md.

import type { EntityId } from "@/lib/types/common";

/**
 * Plan de membresía.
 * Campos tomados de los criterios de BE-3.1 y FE-6.1: nombre, precio, duración y clases.
 */
export interface MembershipPlan {
  id: EntityId;
  name: string;
  price: number;
  /** Duración del plan en la unidad que defina el backend. TODO(contract) */
  duration: number;
  /** Clases incluidas; `null` cuando el plan es ilimitado. TODO(contract) */
  classesIncluded: number | null;
  /** TODO(contract): el backend aún no documenta los valores de estado. */
  status: string;
}

export interface CreatePlanRequest {
  name: string;
  price: number;
  duration: number;
  classesIncluded: number | null;
}

/** El endpoint de edición es `PUT`, por lo que envía el plan completo. */
export type UpdatePlanRequest = CreatePlanRequest;

export interface UpdatePlanStatusRequest {
  /** TODO(contract): confirmar los valores aceptados (activar/desactivar). */
  status: string;
}
