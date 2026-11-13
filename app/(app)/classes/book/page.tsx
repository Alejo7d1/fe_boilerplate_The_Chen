import type { Metadata } from "next";

import { listClassSessions } from "@/lib/api/classes";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { nextDays } from "@/lib/date-range";
import { BookingBoard } from "@/components/classes/booking-board";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { RetryError } from "@/components/states/retry-error";
import type { ClassSession } from "@/lib/types/classes";

export const metadata: Metadata = { title: "Reservar clase" };

const WINDOW_DAYS = 7;

export default async function BookClassPage() {
  await requireRole(["MIEMBRO"]);

  const days = nextDays(WINDOW_DAYS);

  let sessions: ClassSession[] = [];
  let error: string | null = null;

  try {
    const all = await listClassSessions();
    const window = new Set(days);
    sessions = all.filter((session) => window.has(session.date));
  } catch (cause) {
    logActionError("GET /api/class-sessions", cause);
    error = describeApiError(cause, "No pudimos cargar las clases disponibles.");
  }

  return (
    <>
      <PageHeader
        title="Reservar clase"
        description="Consulta los próximos 7 días y reserva un cupo en la clase que prefieras."
      />
      {error ? (
        <RetryError description={error} />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No hay clases programadas"
          description="No hay sesiones en los próximos 7 días. Vuelve a intentarlo más tarde."
        />
      ) : (
        <BookingBoard sessions={sessions} days={days} />
      )}
    </>
  );
}
