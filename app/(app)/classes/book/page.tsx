import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";

import { listClassSessions } from "@/lib/api/classes";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { nextDays } from "@/lib/date-range";
import { BookingBoard } from "@/components/classes/booking-board";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { RetryError } from "@/components/states/retry-error";
import { Button } from "@/components/ui/button";
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
        description="Consulta los próximos 7 días, elige el horario que te acomode y aparta tu cupo."
      />
      {error ? (
        <RetryError description={error} />
      ) : sessions.length === 0 ? (
        <div className="bg-card/40 rounded-xl border border-dashed p-4">
          <EmptyState
            title="No hay clases esta semana"
            description="En los próximos 7 días no hay sesiones publicadas. Mientras tanto puedes agendar una sesión personal con tu entrenador."
            icon={CalendarDays}
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/trainers/book">
                  <Users />
                  Sesión personal
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <BookingBoard sessions={sessions} days={days} />
      )}
    </>
  );
}
