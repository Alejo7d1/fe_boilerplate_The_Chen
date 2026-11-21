import type { Metadata } from "next";
import { CircleAlert } from "lucide-react";

import { describeApiError, logActionError } from "@/lib/actions/errors";
import { listClassSessions } from "@/lib/api/classes";
import { listReviewAnalytics } from "@/lib/api/reviews";
import { listTrainers } from "@/lib/api/trainers";
import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import {
  ReviewAnalyticsFilters,
  type ReviewAnalyticsClassOption,
} from "@/components/reviews/review-analytics-filters";
import { ReviewAnalyticsTable } from "@/components/reviews/review-analytics-table";
import { RetryError } from "@/components/states/retry-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { addDays, todayIso } from "@/lib/date-range";
import type { ReviewAverage } from "@/lib/types/reviews";
import type { TrainerSummary } from "@/lib/types/trainers";

export const metadata: Metadata = { title: "Promedios de reseñas" };

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface ReportsSearchParams {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readDate(value: string | string[] | undefined): string | undefined {
  const raw = readParam(value);
  return raw && DATE_REGEX.test(raw) ? raw : undefined;
}

/** Las opciones de filtro no bloquean el reporte si su endpoint falla. */
async function optionalList<T>(
  load: () => Promise<T[]>,
  scope: string
): Promise<T[]> {
  try {
    return await load();
  } catch (cause) {
    logActionError(scope, cause);
    return [];
  }
}

export default async function ReviewReportPage({ searchParams }: ReportsSearchParams) {
  await requireRole(["RECEPCION_ADMIN"]);

  const params = await searchParams;
  const today = todayIso();
  const startDate = readDate(params.startDate) ?? addDays(today, -29);
  const endDate = readDate(params.endDate) ?? today;
  const trainerId = readParam(params.trainerId);
  const classId = readParam(params.classId);
  const invalidRange = startDate > endDate;

  let averages: ReviewAverage[] = [];
  let error: string | null = null;

  if (!invalidRange) {
    try {
      averages = await listReviewAnalytics({ startDate, endDate, trainerId, classId });
    } catch (cause) {
      logActionError("GET /api/reviews/analytics", cause);
      error = describeApiError(cause, "No pudimos cargar los promedios de reseñas.");
    }
  }

  const [trainers, sessions] = await Promise.all([
    optionalList<TrainerSummary>(listTrainers, "GET /api/trainers"),
    optionalList(listClassSessions, "GET /api/class-sessions"),
  ]);

  const classOptions: ReviewAnalyticsClassOption[] = sessions.map((session) => ({
    id: session.id,
    name: session.name,
  }));

  return (
    <>
      <PageHeader
        title="Promedios de reseñas"
        description="Consulta el promedio de calificaciones por entrenador y por clase en un rango de fechas."
      />

      <ReviewAnalyticsFilters
        key={`${startDate}-${endDate}-${trainerId ?? ""}-${classId ?? ""}`}
        startDate={startDate}
        endDate={endDate}
        trainerId={trainerId}
        classId={classId}
        trainers={trainers}
        classes={classOptions}
      />

      {invalidRange ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Rango de fechas inválido</AlertTitle>
          <AlertDescription>
            La fecha inicial no puede ser posterior a la final.
          </AlertDescription>
        </Alert>
      ) : error ? (
        <RetryError description={error} />
      ) : (
        <ReviewAnalyticsTable averages={averages} />
      )}
    </>
  );
}
