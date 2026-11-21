"use server";

import { revalidatePath } from "next/cache";

import { describeApiError, errorCode, logActionError } from "@/lib/actions/errors";
import type { ActionErrorCode } from "@/lib/actions/form-state";
import { createReview } from "@/lib/api/reviews";
import { hasAnyRole } from "@/lib/auth-guard";
import { validateReview, type RawReview } from "@/lib/review-rules";
import type { Review } from "@/lib/types/reviews";

const FORBIDDEN = "Solo los miembros pueden calificar clases.";

export interface CreateReviewResult {
  ok: boolean;
  message?: string;
  review?: Review;
  fieldErrors?: Record<string, string>;
  code?: ActionErrorCode;
}

/** H16 · `POST /api/reviews` con estrellas 1–5 y comentario opcional acotado. */
export async function createReviewAction(
  input: RawReview
): Promise<CreateReviewResult> {
  if (!(await hasAnyRole(["MIEMBRO"]))) {
    return { ok: false, message: FORBIDDEN, code: "forbidden" };
  }

  const parsed = validateReview(input);
  if (parsed.fieldErrors) {
    return {
      ok: false,
      message: "Revisa tu calificación.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  try {
    const review = await createReview(parsed.input);
    revalidatePath("/reviews");
    return { ok: true, review, message: "Gracias por tu calificación." };
  } catch (cause) {
    logActionError("reviews.create", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos guardar tu calificación."),
      code: errorCode(cause),
    };
  }
}
