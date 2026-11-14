"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Info,
  UserRound,
} from "lucide-react";

import { CapacityBar } from "@/components/capacity-bar";
import { ReserveButton } from "@/components/classes/reserve-button";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groupByDate } from "@/lib/date-range";
import {
  capitalizeSentence,
  formatDate,
  formatDayNumber,
  formatDuration,
  formatLongDate,
  formatMonthShort,
  formatWeekdayShort,
} from "@/lib/format";
import type { ClassSession } from "@/lib/types/classes";
import type { IsoDate } from "@/lib/types/common";
import { cn } from "@/lib/utils";

export interface BookingBoardProps {
  sessions: ClassSession[];
  /** Ventana de 7 días calculada en el servidor para evitar desajustes de hidratación. */
  days: IsoDate[];
}

export function BookingBoard({ sessions, days }: BookingBoardProps) {
  const byDate = useMemo(() => groupByDate(sessions), [sessions]);

  // Abrir en hoy si tiene clases; si no, en el primer día con horarios.
  const [activeDay, setActiveDay] = useState<IsoDate>(
    () =>
      (byDate.get(days[0])?.length ?? 0) > 0
        ? days[0]
        : (days.find((day) => (byDate.get(day)?.length ?? 0) > 0) ?? days[0])
  );

  const freeSeats = useMemo(
    () =>
      sessions.reduce(
        (total, session) => total + Math.max(0, session.availableSpots),
        0
      ),
    [sessions]
  );

  const daysWithClasses = useMemo(
    () => days.filter((day) => (byDate.get(day)?.length ?? 0) > 0).length,
    [byDate, days]
  );

  /** Recorre la semana en círculo para no dejar al usuario en un día vacío. */
  function nextDayWithClasses(day: IsoDate): IsoDate | null {
    const start = days.indexOf(day);
    for (let offset = 1; offset < days.length; offset += 1) {
      const candidate = days[(start + offset) % days.length];
      if ((byDate.get(candidate)?.length ?? 0) > 0) return candidate;
    }
    return null;
  }

  return (
    <Tabs
      value={activeDay}
      onValueChange={setActiveDay}
      className="flex flex-col gap-5"
    >
      <section className="bg-card relative isolate overflow-hidden rounded-2xl border p-4 md:p-5">
        <div
          aria-hidden
          className="bg-radial-glow absolute inset-0 -z-10 opacity-90"
        />
        <div
          aria-hidden
          className="bg-grid absolute inset-0 -z-10 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <CalendarDays className="size-5" aria-hidden />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium">Próximos 7 días</span>
              <span className="text-muted-foreground text-xs">
                {formatDate(days[0])} — {formatDate(days[days.length - 1])}
              </span>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden h-9 md:block" />

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <SummaryValue value={sessions.length} label="clases" />
            <SummaryValue value={freeSeats} label="cupos libres" />
            <SummaryValue value={daysWithClasses} label="días con clases" />
          </div>
        </div>
      </section>

      <TabsList className="bg-muted/70 min-h-11 w-full gap-1 rounded-xl p-1">
        {days.map((day, index) => {
          const count = byDate.get(day)?.length ?? 0;
          return (
            <TabsTrigger
              key={day}
              value={day}
              aria-label={`${capitalizeSentence(formatLongDate(day))}: ${count} ${
                count === 1 ? "clase" : "clases"
              }`}
              className={cn(
                "h-9 flex-1 flex-col gap-0 rounded-lg px-1 py-0 text-xs data-active:shadow-sm",
                count === 0 && "text-muted-foreground/70 data-active:text-foreground"
              )}
            >
              <span className="text-[0.58rem] leading-none font-medium tracking-wide uppercase opacity-70">
                {index === 0 ? "Hoy" : formatWeekdayShort(day)}
              </span>
              <span className="font-heading text-[0.8rem] leading-none font-semibold tabular-nums">
                {formatDayNumber(day)}
                <span className="ml-1 text-[0.58rem] font-normal opacity-70">
                  {formatMonthShort(day)}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 size-1 rounded-full",
                  count > 0 ? "bg-primary" : "bg-transparent"
                )}
              />
            </TabsTrigger>
          );
        })}
      </TabsList>

      {days.map((day) => {
        const items = byDate.get(day) ?? [];
        const dayFreeSeats = items.reduce(
          (total, session) => total + Math.max(0, session.availableSpots),
          0
        );
        const alternative = nextDayWithClasses(day);

        return (
          <TabsContent key={day} value={day} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-secondary text-secondary-foreground flex size-12 shrink-0 flex-col items-center justify-center rounded-xl leading-none">
                <span className="text-[0.58rem] font-medium tracking-wide uppercase opacity-80">
                  {formatWeekdayShort(day)}
                </span>
                <span className="font-heading mt-0.5 text-lg font-semibold tabular-nums">
                  {formatDayNumber(day)}
                </span>
              </span>
              <div className="flex min-w-0 flex-col">
                <h2 className="font-heading truncate text-base font-semibold">
                  {capitalizeSentence(formatLongDate(day))}
                </h2>
                <p className="text-muted-foreground text-xs">
                  {items.length === 0
                    ? "Sin clases programadas"
                    : `${items.length} ${items.length === 1 ? "clase" : "clases"} · ${dayFreeSeats} ${
                        dayFreeSeats === 1 ? "cupo libre" : "cupos libres"
                      }`}
                </p>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed">
                <EmptyState
                  title="No hay clases este día"
                  description={
                    alternative
                      ? `El siguiente día con clases es el ${formatLongDate(alternative)}.`
                      : "Elige otro día de la semana para ver horarios disponibles."
                  }
                  icon={CalendarDays}
                  action={
                    alternative ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setActiveDay(alternative)}
                      >
                        Ver ese día
                        <ArrowRight />
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((session) => {
                  const free = Math.max(0, session.availableSpots);
                  const occupied = Math.max(0, session.maxCapacity - free);
                  return (
                    <Card
                      key={session.id}
                      className="group/class relative flex flex-col overflow-hidden transition-shadow hover:shadow-md"
                    >
                      <span
                        aria-hidden
                        className="from-primary via-info to-accent absolute inset-x-0 top-0 h-1 bg-linear-to-r"
                      />
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <CardTitle className="truncate text-base">
                              {session.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1.5">
                              <UserRound
                                className="size-3.5 shrink-0"
                                aria-hidden
                              />
                              <span className="truncate">
                                {session.trainerName}
                              </span>
                            </CardDescription>
                          </div>
                          {free === 0 ? (
                            <Badge variant="destructive">Sin cupos</Badge>
                          ) : free <= 2 ? (
                            <Badge variant="secondary">Últimos lugares</Badge>
                          ) : (
                            <Badge variant="outline">{free} libres</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="bg-secondary text-secondary-foreground font-heading rounded-lg px-2 py-1 text-sm font-semibold tabular-nums">
                            {session.startTime}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Clock className="size-3.5" aria-hidden />
                            {formatDuration(session.durationMinutes)}
                          </span>
                          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                            {occupied}/{session.maxCapacity} cupos
                          </span>
                        </div>
                        <CapacityBar
                          occupied={occupied}
                          capacity={session.maxCapacity}
                        />
                        <ReserveButton
                          session={session}
                          freeSeats={free}
                          className="mt-auto w-full"
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        );
      })}

      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Puedes apartar un cupo por clase. Si no puedes asistir, cancela desde
        «Mis reservas» para liberar el lugar.
      </p>
    </Tabs>
  );
}

function SummaryValue({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-heading text-lg font-semibold tabular-nums">
        {value}
      </span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}
