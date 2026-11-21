import type { Metadata } from "next";

import { describeApiError, logActionError } from "@/lib/actions/errors";
import { listReviewableClasses } from "@/lib/api/reviews";
import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { ReviewBoard } from "@/components/reviews/review-board";
import { RetryError } from "@/components/states/retry-error";
import { todayIso } from "@/lib/date-range";
import type { ReviewableClass } from "@/lib/types/reviews";

export const metadata: Metadata = { title: "Reseñas" };

export default async function ReviewsPage() {
  await requireRole(["MIEMBRO"]);

  let classes: ReviewableClass[] = [];
  let error: string | null = null;

  try {
    classes = await listReviewableClasses();
  } catch (cause) {
    logActionError("GET /api/reservations/me + /api/class-sessions", cause);
    error = describeApiError(cause, "No pudimos cargar tus clases por calificar.");
  }

  return (
    <>
      <PageHeader
        title="Calificar clases"
        description="Califica las clases a las que asististe. Tienes 7 días desde la fecha de la clase para dejar tu reseña."
      />
      {error ? (
        <RetryError description={error} />
      ) : (
        <ReviewBoard classes={classes} today={todayIso()} />
      )}
    </>
  );
}
