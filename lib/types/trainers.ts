// lib/types/trainers.ts
// H7 · Registro de bloques de disponibilidad de entrenador.
// H8 · Agendamiento de sesión personal.
// Contrato pendiente de confirmar con Backend: ver docs/api-contracts.md.

import type { EntityId, IsoDate, IsoTime } from "@/lib/types/common";

export interface TrainerSummary {
  id: EntityId;
  name: string;
}

/** Bloque de disponibilidad tal como lo devuelve BE-7.1. */
export interface TrainerAvailabilitySlot {
  slotId: EntityId;
  date: IsoDate;
  startTime: IsoTime;
  endTime: IsoTime;
  isBooked: boolean;
}

/** BE-7.1: el backend calcula `endTime` sumando 60 minutos a `startTime`. */
export interface CreateAvailabilityRequest {
  date: IsoDate;
  startTime: IsoTime;
}

export type CreateAvailabilityResponse = TrainerAvailabilitySlot;

/** Solicitud de sesión personal. TODO(contract): confirmar el cuerpo esperado. */
export interface BookPersonalSessionRequest {
  trainerId: EntityId;
  slotId: EntityId;
}

export interface BookPersonalSessionResponse {
  /** TODO(contract): confirmar el identificador y el estado devueltos por el backend. */
  sessionId: EntityId;
  status: string;
}
