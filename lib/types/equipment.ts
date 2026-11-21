// lib/types/equipment.ts
// H14 · Administración de estados de máquinas.
// H15 · Consulta de disponibilidad (mismo recurso y DTO).

import type { EntityId } from "@/lib/types/common";

/** Estados que el backend acepta y devuelve, con la grafía exacta del contrato. */
export const EQUIPMENT_STATUSES = [
  "Operativa",
  "En Mantenimiento",
  "Fuera de Servicio",
] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export function isEquipmentStatus(value: string): value is EquipmentStatus {
  return (EQUIPMENT_STATUSES as readonly string[]).includes(value);
}

/** `GET /api/equipment` · mismo DTO para consulta y administración. */
export interface Equipment {
  id: EntityId;
  name: string;
  category?: string;
  status: EquipmentStatus;
  /** Vigente solo cuando el estado no es `Operativa`. */
  reason: string | null;
  updatedAt?: string;
}

/** `PATCH /api/equipment/:id/status` */
export interface UpdateEquipmentStatusRequest {
  status: EquipmentStatus;
  reason: string | null;
}
