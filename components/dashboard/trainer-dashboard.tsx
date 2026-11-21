import Link from "next/link";
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CircleHelp,
  Clock,
} from "lucide-react";

import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DataErrorNote } from "@/components/dashboard/data-error-note";
import { DatePill } from "@/components/dashboard/date-pill";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { listTrainerAvailability } from "@/lib/api/trainers";
import { readSettled, tallySlots, upcomingSlots } from "@/lib/dashboard";
import { nextDays } from "@/lib/date-range";
import {
  formatDayNumber,
  formatLongDate,
  formatMonthShort,
  formatWeekdayShort,
} from "@/lib/format";
import { formatAvailabilityRange } from "@/lib/schedule";
import { availabilityLabel, availabilityTone } from "@/lib/status";

export interface TrainerDashboardProps {
  userId?: string;
}

export async function TrainerDashboard({ userId }: TrainerDashboardProps) {
  if (!userId) {
    return (
      <ErrorState
        title="No pudimos identificar tu cuenta"
        description="Tu sesión no incluye el identificador del usuario (claim «sub»), así que no es posible cargar tu agenda. Vuelve a iniciar sesión."
      />
    );
  }

  const [availabilityResult] = await Promise.allSettled([
    listTrainerAvailability(userId),
  ]);
  const availability = readSettled(
    availabilityResult,
    "GET /api/trainers/:id/availability",
    "No pudimos cargar tu disponibilidad."
  );

  const slots = availability.data ?? [];
  const tally = tallySlots(slots);
  const nextSlots = upcomingSlots(slots, 5);
  const nextSlot = nextSlots[0] ?? null;
  const week = nextDays(7).map((day) => ({
    day,
    count: slots.filter((slot) => slot.date === day).length,
  }));
  const busiest = Math.max(1, ...week.map((entry) => entry.count));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Bloques registrados"
          value={availability.data ? String(tally.total) : "—"}
          hint={availability.error ?? "En tu agenda de disponibilidad"}
          icon={CalendarClock}
          tone="primary"
          href="/trainer/availability"
        />
        <StatCard
          label="Bloques libres"
          value={availability.data ? String(tally.free) : "—"}
          hint="Disponibles para sesiones personales"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Reservados"
          value={availability.data ? String(tally.booked) : "—"}
          hint="Con una sesión agendada"
          icon={Clock}
          tone="info"
        />
        <StatCard
          label="Sin información"
          value={availability.data ? String(tally.unknown) : "—"}
          hint="El backend no reportó el estado"
          icon={CircleHelp}
          tone="muted"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardPanel
          title="Próximos bloques"
          description="Bloques de 60 minutos desde hoy."
          icon={CalendarClock}
          action={{ label: "Mi disponibilidad", href: "/trainer/availability" }}
          className="lg:col-span-3"
        >
          {availability.error ? <DataErrorNote message={availability.error} /> : null}

          {nextSlots.length === 0 ? (
            <EmptyState
              title="No tienes bloques próximos"
              description="Registra bloques de 60 minutos entre las 06:00 y las 21:00."
              icon={CalendarPlus}
              action={
                <Button asChild size="sm">
                  <Link href="/trainer/availability">Registrar bloque</Link>
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {nextSlots.map((slot) => (
                <li
                  key={slot.slotId}
                  className="bg-muted/40 hover:bg-muted/70 flex items-center gap-3 rounded-lg border p-2.5 transition-colors"
                >
                  <DatePill iso={slot.date} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium tabular-nums">
                      {formatAvailabilityRange(slot.startTime)}
                    </p>
                    <p className="text-muted-foreground truncate text-xs capitalize">
                      {formatLongDate(slot.date)}
                    </p>
                  </div>
                  <StatusBadge
                    label={availabilityLabel(slot.isBooked)}
                    tone={availabilityTone(slot.isBooked)}
                  />
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Tus próximos 7 días"
          description="Bloques registrados por día."
          icon={CalendarClock}
          className="lg:col-span-2"
        >
          <ul className="flex flex-col gap-2">
            {week.map(({ day, count }) => (
              <li key={day} className="flex items-center gap-3">
                <span className="flex w-16 shrink-0 items-baseline gap-1 text-xs">
                  <span className="text-muted-foreground capitalize">
                    {formatWeekdayShort(day)}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatDayNumber(day)} {formatMonthShort(day)}
                  </span>
                </span>
                <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                  <span
                    className="bg-primary block h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${(count / busiest) * 100}%` }}
                  />
                </span>
                <span className="text-muted-foreground w-4 shrink-0 text-right text-xs tabular-nums">
                  {count}
                </span>
              </li>
            ))}
          </ul>
          {nextSlot ? (
            <p className="text-muted-foreground mt-auto text-xs">
              Siguiente bloque: {formatLongDate(nextSlot.date)} a las{" "}
              {nextSlot.startTime}.
            </p>
          ) : null}
        </DashboardPanel>
      </div>
    </>
  );
}
