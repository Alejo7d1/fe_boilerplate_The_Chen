// lib/review-rules.ts
// Reglas compartidas de H16: validación de la calificación, ventana de 7 días
// y armado de las clases calificables a partir de las reservas del miembro.

import { addDays, todayIso } from "@/lib/date-range";
import type { ClassReservation, ClassSession } from "@/lib/types/classes";
import {
  REVIEW_COMMENT_MAX,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
  REVIEW_WINDOW_DAYS,
  type ReviewableClass,
} from "@/lib/types/reviews";

export type FieldErrors = Record<string, string>;

const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `true` cuando el catálogo de sesiones marca la clase como terminada. */
export function isFinishedClass(status: string): boolean {
  return status.trim().toLowerCase().includes("finaliz");
}

/** Último día en que se admite la reseña: fecha de la clase + 7 días. */
export function reviewDeadline(date: string): string {
  return addDays(date, REVIEW_WINDOW_DAYS);
}

/** `true` cuando hoy cae dentro del plazo de calificación de la clase. */
export function isReviewWindowOpen(date: string, today: string = todayIso()): boolean {
  if (!DATE_REGEX.test(date)) return false;
  if (date > today) return false;
  return today <= reviewDeadline(date);
}

/**
 * Clases calificables: reservas activas del miembro sobre sesiones finalizadas.
 * Una reserva cancelada o una sesión que no está finalizada no se ofrece.
 */
export function buildReviewableClasses(
  reservations: readonly ClassReservation[],
  sessions: readonly ClassSession[]
): ReviewableClass[] {
  const sessionsById = new Map(sessions.map((session) => [session.id, session]));
  const seen = new Set<string>();
  const reviewable: ReviewableClass[] = [];

  for (const reservation of reservations) {
    if (reservation.status !== "Activa") continue;
    if (seen.has(reservation.classId)) continue;

    const session = sessionsById.get(reservation.classId);
    if (!session || !isFinishedClass(session.status)) continue;

    seen.add(reservation.classId);
    reviewable.push({
      sessionId: session.id,
      name: session.name,
      trainerName: session.trainerName,
      date: session.date,
      startTime: session.startTime,
    });
  }

  return reviewable.sort((a, b) =>
    `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)
  );
}

/** Etiqueta legible del objetivo de una reseña. */
export function reviewTargetLabel(targetType: string): string {
  const value = targetType.trim().toUpperCase();
  if (value === "TRAINER" || value === "ENTRENADOR") return "Entrenador";
  if (value === "CLASS" || value === "CLASE") return "Clase";
  return targetType;
}

export interface RawReview {
  sessionId: string;
  rating: string | number;
  comment?: string;
}

export interface NormalizedReview {
  sessionId: string;
  rating: number;
  comment?: string;
}

function parseRating(value: string | number): number {
  if (typeof value === "number") return value;
  const text = value.trim();
  return text ? Number(text) : NaN;
}

/** Devuelve `{ input }` cuando la reseña es válida o `{ fieldErrors }` con el detalle. */
export function validateReview(
  raw: RawReview
): { input: NormalizedReview; fieldErrors?: never } | { fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {};

  const sessionId = raw.sessionId.trim();
  if (!sessionId) fieldErrors.sessionId = "No se indicó la clase a calificar.";

  const rating = parseRating(raw.rating);
  if (
    !Number.isInteger(rating) ||
    rating < REVIEW_RATING_MIN ||
    rating > REVIEW_RATING_MAX
  ) {
    fieldErrors.rating = `Elige entre ${REVIEW_RATING_MIN} y ${REVIEW_RATING_MAX} estrellas.`;
  }

  const comment = (raw.comment ?? "").trim();
  if (comment.length > REVIEW_COMMENT_MAX) {
    fieldErrors.comment = `El comentario admite hasta ${REVIEW_COMMENT_MAX} caracteres.`;
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    input: {
      sessionId,
      rating,
      ...(comment ? { comment } : {}),
    },
  };
}
