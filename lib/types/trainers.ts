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
  /**
   * `null` cuando el backend no lo informa. **No se usa para pintar el rango**:
   * el backend de pruebas devuelve siempre `11:00` sea cual sea `startTime`, así
   * que la UI deriva el fin con la regla documentada (start + 60 min).
   */
  endTime: IsoTime | null;
  /**
   * `null` cuando el backend no informa el estado del bloque.
   * Se representa como «—» en la UI: nunca se asume que está libre.
   */
  isBooked: boolean | null;
}

/** BE-7.1: el backend calcula `endTime` sumando 60 minutos a `startTime`. */
export interface CreateAvailabilityRequest {
  date: IsoDate;
  startTime: IsoTime;
}

/**
 * TODO(contract): la respuesta del alta no está documentada. La acción no lee
 * campos y la pantalla se refresca desde el servidor.
 */
export type CreateAvailabilityResponse = TrainerAvailabilitySlot;

/** TODO(contract): confirmar el cuerpo esperado por `POST /api/personal-sessions`. */
export interface BookPersonalSessionRequest {
  trainerId: EntityId;
  slotId: EntityId;
}

/**
 * TODO(contract): el backend no documenta la respuesta del agendamiento. La
 * acción no lee campos y la cuadrícula se refresca desde el servidor.
 */
export interface BookPersonalSessionResponse {
  sessionId: EntityId;
  status: string;
}
