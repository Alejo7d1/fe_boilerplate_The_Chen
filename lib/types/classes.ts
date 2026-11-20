// lib/types/classes.ts
// H4 · Reserva de cupo en una clase.
// H5 · Cancelación de reserva.
// H6 · Definición, edición y cancelación de clases.
// Contrato pendiente de confirmar con Backend: ver docs/api-contracts.md.

import type { EntityId, IsoDate, IsoTime } from "@/lib/types/common";

/** Valores documentados en BE-4.1 (`Activa`) y DB-5.1 (`Cancelada`). */
export type ReservationStatus = "Activa" | "Cancelada";

/**
 * Sesión de clase (contrato de `GET /api/class-sessions`).
 * `availableSpots` lo calcula el backend; `trainerName` viene resuelto.
 */
export interface ClassSession {
  id: EntityId;
  name: string;
  trainerId: EntityId;
  trainerName: string;
  date: IsoDate;
  startTime: IsoTime;
  durationMinutes: number;
  maxCapacity: number;
  availableSpots: number;
  /** Valores observados: `Programada`, `Cancelada`, `Finalizada`. */
  status: string;
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

/** Reserva del miembro autenticado (contrato de `GET /api/reservations/me`). */
export interface ClassReservation {
  id: EntityId;
  classId: EntityId;
  name: string;
  date: IsoDate;
  startTime: IsoTime;
  status: ReservationStatus;
  /** DB-5.1: se registra solo cuando la reserva se cancela. */
  cancelledAt?: IsoDate;
}
