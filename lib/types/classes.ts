// lib/types/classes.ts
// H4 · Reserva de cupo en una clase.
// H5 · Cancelación de reserva.
// H6 · Definición, edición y cancelación de clases.
// Contrato pendiente de confirmar con Backend: ver docs/api-contracts.md.

import type { EntityId, IsoDate, IsoTime } from "@/lib/types/common";
import type { TrainerSummary } from "@/lib/types/trainers";

/** Valores documentados en BE-4.1 (`Activa`) y DB-5.1 (`Cancelada`). */
export type ReservationStatus = "Activa" | "Cancelada";

/**
 * Sesión de clase programada.
 * Campos tomados de FE-4.1 (cupos calculados) y FE-6.1 (formulario administrativo).
 */
export interface ClassSession {
  id: EntityId;
  name: string;
  trainer: TrainerSummary;
  date: IsoDate;
  startTime: IsoTime;
  /** Duración en minutos. TODO(contract): confirmar si el backend envía la hora de fin. */
  durationMinutes: number;
  maxCapacity: number;
  /** Reservas activas: los cupos libres son `maxCapacity - activeReservations`. */
  activeReservations: number;
}

export interface CreateClassRequest {
  name: string;
  trainerId: EntityId;
  date: IsoDate;
  startTime: IsoTime;
  durationMinutes: number;
  maxCapacity: number;
}

/** El endpoint de edición es `PUT`, por lo que envía la clase completa. */
export type UpdateClassRequest = CreateClassRequest;

/** FE-6.2: la cancelación de clase captura el motivo. */
export interface CancelClassRequest {
  reason: string;
}

/** Resultado de `POST /api/class-sessions/:id/reserve` según BE-4.1. */
export interface ReserveClassSeatResponse {
  reservationId: EntityId;
  status: ReservationStatus;
  message?: string;
}

/** Reserva del miembro autenticado (H5). */
export interface ClassReservation {
  id: EntityId;
  classSession: Pick<ClassSession, "id" | "name" | "date" | "startTime">;
  status: ReservationStatus;
  /** DB-5.1: fecha y motivo se registran solo cuando la reserva se cancela. */
  cancelledAt?: IsoDate;
  cancellationReason?: string;
}
