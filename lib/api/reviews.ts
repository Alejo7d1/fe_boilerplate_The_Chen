// lib/api/reviews.ts
// H16 · Alta de reseñas de clases.
// H17 · Promedios de reseñas por entrenador y por clase.
// Único lugar donde se conoce el contrato de /api/reviews.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { listClassSessions } from "@/lib/api/classes";
import {
  asRecord,
  readArray,
  readOptionalNumber,
  readOptionalString,
  readString,
} from "@/lib/api/normalize";
import { listMyReservations } from "@/lib/api/reservations";
import { buildReviewableClasses } from "@/lib/review-rules";
import type {
  CreateReviewRequest,
  Review,
  ReviewAnalyticsQuery,
  ReviewAverage,
  ReviewableClass,
} from "@/lib/types/reviews";

/** El backend de pruebas solo confirma `reviewId`, `sessionId` y `rating`. */
export function normalizeCreatedReview(
  raw: unknown,
  input: CreateReviewRequest
): Review {
  const record = asRecord(raw, "reseña");
  return {
    id: readString(record, "reseña", ["reviewId", "id", "_id"]),
    sessionId:
      readOptionalString(record, ["sessionId", "classSessionId", "classId"]) ??
      input.sessionId,
    rating:
      readOptionalNumber(record, ["rating", "stars", "estrellas"]) ?? input.rating,
    createdAt: readOptionalString(record, ["createdAt", "created_at"]),
  };
}

/**
 * Fila de promedios. Acepta la forma de BE-17.1 (`{ trainerId, ... }` dentro de
 * `byTrainer`) y la del backend de pruebas (`{ targetType, targetId, ... }`).
 * `average` y `totalReviews` quedan en `null` cuando el backend no los envía.
 */
export function normalizeReviewAverage(
  raw: unknown,
  context = "promedio de reseñas",
  fallbackTargetType?: string
): ReviewAverage {
  const record = asRecord(raw, context);
  return {
    targetType:
      fallbackTargetType ?? readString(record, context, ["targetType", "type", "tipo"]),
    targetId: readString(record, context, [
      "targetId",
      "trainerId",
      "classId",
      "id",
      "_id",
    ]),
    targetName: readString(record, context, [
      "targetName",
      "trainerName",
      "className",
      "name",
      "nombre",
    ]),
    average:
      readOptionalNumber(record, ["average", "averageRating", "rating", "promedio"]) ??
      null,
    totalReviews:
      readOptionalNumber(record, ["totalReviews", "reviewCount", "total", "count"]) ??
      null,
  };
}

/** Acepta `{ data: [...] }` y la forma documentada `{ byTrainer, byClass }`. */
export function normalizeReviewAnalytics(payload: unknown): ReviewAverage[] {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const wrapper = payload as Record<string, unknown>;
    const byTrainer = wrapper.byTrainer;
    const byClass = wrapper.byClass;

    if (Array.isArray(byTrainer) || Array.isArray(byClass)) {
      return [
        ...(Array.isArray(byTrainer) ? byTrainer : []).map((item, index) =>
          normalizeReviewAverage(item, `promedios.byTrainer[${index}]`, "TRAINER")
        ),
        ...(Array.isArray(byClass) ? byClass : []).map((item, index) =>
          normalizeReviewAverage(item, `promedios.byClass[${index}]`, "CLASS")
        ),
      ];
    }
  }

  return readArray(payload, "promedios de reseñas").map((item, index) =>
    normalizeReviewAverage(item, `promedios[${index}]`)
  );
}

/** `POST /api/reviews` con `{ sessionId, rating, comment? }`. */
export async function createReview(input: CreateReviewRequest): Promise<Review> {
  const payload = await apiFetch<unknown>(API_ROUTES.reviews.create, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeCreatedReview(payload, input);
}

/** `GET /api/reviews/analytics?startDate&endDate&trainerId&classId`. */
export async function listReviewAnalytics(
  query: ReviewAnalyticsQuery
): Promise<ReviewAverage[]> {
  const params = new URLSearchParams({
    startDate: query.startDate,
    endDate: query.endDate,
  });
  if (query.trainerId) params.set("trainerId", query.trainerId);
  if (query.classId) params.set("classId", query.classId);

  const payload = await apiFetch<unknown>(
    `${API_ROUTES.reviews.analytics}?${params.toString()}`
  );
  return normalizeReviewAnalytics(payload);
}

/**
 * Clases que el miembro puede calificar. No existe un endpoint propio: se
 * cruzan sus reservas con las sesiones y se conservan las finalizadas.
 */
export async function listReviewableClasses(): Promise<ReviewableClass[]> {
  const [reservations, sessions] = await Promise.all([
    listMyReservations(),
    listClassSessions(),
  ]);
  return buildReviewableClasses(reservations, sessions);
}
