"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Clock, Info } from "lucide-react";
import { toast } from "sonner";

import { bookPersonalSessionAction } from "@/app/actions/personal-sessions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/states/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { TrainerPicker } from "@/components/trainers/trainer-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groupByDate } from "@/lib/date-range";
import {
  capitalizeSentence,
  formatDayNumber,
  formatLongDate,
  formatMonthShort,
  formatWeekdayShort,
} from "@/lib/format";
import {
  AVAILABILITY_SLOT_MINUTES,
  CLUB_CLOSE_TIME,
  CLUB_OPEN_TIME,
  formatAvailabilityRange,
} from "@/lib/schedule";
import { availabilityLabel, availabilityTone } from "@/lib/status";
import type { IsoDate } from "@/lib/types/common";
import type {
  TrainerAvailabilitySlot,
  TrainerSummary,
} from "@/lib/types/trainers";
import { cn } from "@/lib/utils";

export interface PersonalSessionBoardProps {
  trainers: TrainerSummary[];
  selectedTrainerId: string;
  slots: TrainerAvailabilitySlot[];
  /** Ventana de 14 días calculada en el servidor. */
  days: IsoDate[];
}

export function PersonalSessionBoard({
  trainers,
  selectedTrainerId,
  slots,
  days,
}: PersonalSessionBoardProps) {
  const router = useRouter();
  const byDate = useMemo(() => groupByDate(slots), [slots]);

  function freeCount(day: IsoDate): number {
    return (byDate.get(day) ?? []).filter((slot) => slot.isBooked === false)
      .length;
  }

  // Abrir en el primer día con bloques libres; si no hay, en el primero con agenda.
  const [activeDay, setActiveDay] = useState<IsoDate>(() => {
    const withFree = days.find((day) => freeCount(day) > 0);
    const withAny = days.find((day) => (byDate.get(day)?.length ?? 0) > 0);
    return withFree ?? withAny ?? days[0];
  });

  // La ventana es de 14 días: dos filas de 7 pestañas.
  const weekChunks = useMemo(() => {
    const chunks: IsoDate[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      chunks.push(days.slice(index, index + 7));
    }
    return chunks;
  }, [days]);

  const [selected, setSelected] = useState<TrainerAvailabilitySlot | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const trainerName =
    trainers.find((trainer) => trainer.id === selectedTrainerId)?.name ?? "";

  /** Recorre la ventana en círculo para no dejar al usuario en un día vacío. */
  function nextAvailableDay(day: IsoDate): IsoDate | null {
    const start = days.indexOf(day);
    for (let offset = 1; offset < days.length; offset += 1) {
      const candidate = days[(start + offset) % days.length];
      if (freeCount(candidate) > 0) return candidate;
    }
    return null;
  }

  async function handleConfirm() {
    if (!selected) return;
    setPending(true);
    const result = await bookPersonalSessionAction(
      selectedTrainerId,
      selected.slotId
    );
    setPending(false);

    if (!result.ok) {
      toast.error(result.message, {
        action:
          result.code === "forbidden"
            ? {
                label: "Ver membresía",
                onClick: () => router.push("/membership"),
              }
            : result.code === "conflict"
              ? { label: "Actualizar", onClick: () => router.refresh() }
              : undefined,
      });
      if (result.code === "conflict") {
        setOpen(false);
        router.refresh();
      }
      return;
    }

    toast.success("Sesión personal agendada.");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Entrenador</span>
        <TrainerPicker
          trainers={trainers}
          selectedTrainerId={selectedTrainerId}
        />
      </div>

      <Tabs
        value={activeDay}
        onValueChange={setActiveDay}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          {weekChunks.map((week) => (
            <TabsList
              key={week[0]}
              className="bg-muted/70 min-h-11 w-full gap-1 rounded-xl p-1"
            >
              {week.map((day) => {
                const free = freeCount(day);
                const isToday = day === days[0];
                return (
                  <TabsTrigger
                    key={day}
                    value={day}
                    aria-label={`${capitalizeSentence(formatLongDate(day))}: ${free} ${
                      free === 1 ? "bloque libre" : "bloques libres"
                    }`}
                    className={cn(
                      "h-9 flex-1 flex-col gap-0 rounded-lg px-1 py-0 text-xs data-active:shadow-sm",
                      free === 0 &&
                        "text-muted-foreground/70 data-active:text-foreground"
                    )}
                  >
                    <span className="text-[0.58rem] leading-none font-medium tracking-wide uppercase opacity-70">
                      {isToday ? "Hoy" : formatWeekdayShort(day)}
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
                        free > 0 ? "bg-primary" : "bg-transparent"
                      )}
                    />
                  </TabsTrigger>
                );
              })}
            </TabsList>
          ))}
        </div>

        {days.map((day) => {
          const items = byDate.get(day) ?? [];
          const free = freeCount(day);
          const alternative = nextAvailableDay(day);

          return (
            <TabsContent key={day} value={day} className="flex flex-col gap-3">
              

              {items.length === 0 ? (
                <div className="bg-card/40 rounded-xl border border-dashed p-4">
                  <EmptyState
                    title="Sin bloques este día"
                    description={
                      alternative
                        ? `El siguiente día con bloques libres es el ${formatLongDate(alternative)}.`
                        : `${trainerName || "El entrenador"} no tiene disponibilidad registrada en los próximos 14 días.`
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
                  {items.map((slot) => {
                    const bookable = slot.isBooked === false;
                    return (
                      <Card
                        key={slot.slotId}
                        className="flex flex-col transition-shadow hover:shadow-sm"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Clock
                                  className="text-muted-foreground size-4 shrink-0"
                                  aria-hidden
                                />
                                <span className="tabular-nums">
                                  {formatAvailabilityRange(slot.startTime)}
                                </span>
                              </CardTitle>
                              <CardDescription>
                                {trainerName || "Entrenador"}
                              </CardDescription>
                            </div>
                            <StatusBadge
                              label={availabilityLabel(slot.isBooked)}
                              tone={availabilityTone(slot.isBooked)}
                            />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button
                            type="button"
                            size="sm"
                            className="w-full"
                            disabled={!bookable}
                            onClick={() => {
                              setSelected(slot);
                              setOpen(true);
                            }}
                          >
                            {bookable
                              ? "Agendar sesión"
                              : slot.isBooked === true
                                ? "Reservado"
                                : "No disponible"}
                          </Button>
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

      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Los bloques duran {AVAILABILITY_SLOT_MINUTES} minutos y se muestran en el
        horario del club ({CLUB_OPEN_TIME} a {CLUB_CLOSE_TIME}).
      </p>

      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
        title="Agendar sesión personal"
        description={
          selected
            ? `Se agendará una sesión con ${trainerName} el ${formatLongDate(
                selected.date
              )} de ${formatAvailabilityRange(selected.startTime)}.`
            : "Se agendará la sesión en el bloque seleccionado."
        }
        confirmLabel="Agendar"
        cancelLabel="Volver"
        pending={pending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
