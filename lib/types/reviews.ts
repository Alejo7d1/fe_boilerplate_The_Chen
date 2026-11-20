// lib/types/reviews.ts
// H16 · Calificación de clases (MIEMBRO).
// H17 · Reporte de promedios de reseñas (RECEPCION_ADMIN).
// Contrato tomado de BE-16.1 / BE-17.1; ver docs/api-contracts-ep8-reviews.md.

import type { EntityId, IsoDate, IsoTime } from "@/lib/types/common";

/** Estrellas admitidas por `POST /api/reviews`. */
export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;

/** Comentario opcional de la reseña (FE-16.1). */
export const REVIEW_COMMENT_MAX = 300;

/** FE-16.1: solo se califica dentro de los 7 días posteriores a la clase. */
export const REVIEW_WINDOW_DAYS = 7;

/** `POST /api/reviews` */
export interface CreateReviewRequest {
  sessionId: EntityId;
  rating: number;
  comment?: string;
}

/** Respuesta verificada del alta: `{ reviewId, sessionId, rating, createdAt }`. */
export interface Review {
  id: EntityId;
  sessionId: EntityId;
  rating: number;
  createdAt?: string;
}

/** Clase finalizada a la que el miembro asistió, candidata a calificar. */
export interface ReviewableClass {
  sessionId: EntityId;
  name: string;
  trainerName: string;
  date: IsoDate;
  startTime: IsoTime;
}

/**
 * Fila de `GET /api/reviews/analytics`. El backend de pruebas devuelve
 * `targetType`/`targetId`/`targetName`; BE-17.1 documenta `byTrainer`/`byClass`.
 */
export interface ReviewAverage {
  targetType: string;
  targetId: EntityId;
  targetName: string;
  /** `null` cuando el objetivo todavía no tiene reseñas. */
  average: number | null;
  /** `null` cuando el backend no informa el conteo. */
  totalReviews: number | null;
}

/** Filtros de H17: las fechas son obligatorias en el contrato (BE-17.1). */
export interface ReviewAnalyticsQuery {
  startDate: IsoDate;
  endDate: IsoDate;
  trainerId?: EntityId;
  classId?: EntityId;
}
