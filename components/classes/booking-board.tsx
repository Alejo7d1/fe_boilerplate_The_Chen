"use client";

import { useMemo } from "react";
import { CalendarDays, Clock, Users } from "lucide-react";

import { ReserveButton } from "@/components/classes/reserve-button";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDayNumber, formatDuration, formatLongDate, formatMonthShort, formatWeekdayShort } from "@/lib/format";
import { groupByDate } from "@/lib/date-range";
import type { IsoDate } from "@/lib/types/common";
import type { ClassSession } from "@/lib/types/classes";

export interface BookingBoardProps {
  sessions: ClassSession[];
  /** Ventana de 7 días calculada en el servidor para evitar desajustes de hidratación. */
  days: IsoDate[];
}

export function BookingBoard({ sessions, days }: BookingBoardProps) {
  const byDate = useMemo(() => groupByDate(sessions), [sessions]);

  return (
    <Tabs defaultValue={days[0]} className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <TabsList className="w-max">
          {days.map((day) => {
            const count = byDate.get(day)?.length ?? 0;
            return (
              <TabsTrigger key={day} value={day} className="gap-2">
                <span className="flex flex-col leading-tight">
                  <span className="text-xs capitalize">{formatWeekdayShort(day)}</span>
                  <span className="font-medium">
                    {formatDayNumber(day)} {formatMonthShort(day)}
                  </span>
                </span>
                {count > 0 ? <Badge variant="secondary">{count}</Badge> : null}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {days.map((day) => {
        const items = byDate.get(day) ?? [];
        return (
          <TabsContent key={day} value={day} className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm capitalize">
              {formatLongDate(day)}
            </p>

            {items.length === 0 ? (
              <EmptyState
                title="No hay clases este día"
                description="Elige otro día de la semana para ver horarios disponibles."
                icon={CalendarDays}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((session) => {
                  const freeSeats = Math.max(0, session.availableSpots);
                  return (
                    <Card key={session.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-start justify-between gap-2 text-base">
                          <span>{session.name}</span>
                          {freeSeats === 0 ? (
                            <Badge variant="destructive">Sin cupos</Badge>
                          ) : freeSeats <= 2 ? (
                            <Badge variant="secondary">Últimos lugares</Badge>
                          ) : (
                            <Badge variant="outline">{freeSeats} libres</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{session.trainerName}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="size-4" aria-hidden />
                            {session.startTime} · {formatDuration(session.durationMinutes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="size-4" aria-hidden />
                            {session.maxCapacity - session.availableSpots}/{session.maxCapacity}
                          </span>
                        </div>
                        <ReserveButton session={session} freeSeats={freeSeats} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
