"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, CalendarPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteAvailabilityAction } from "@/app/actions/availability";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { AvailabilitySlotDialog } from "@/components/trainers/availability-slot-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateToIso, isoToLocalDate } from "@/lib/date-range";
import { formatDate, formatLongDate } from "@/lib/format";
import {
  AVAILABILITY_START_OPTIONS,
  formatAvailabilityRange,
} from "@/lib/schedule";
import { availabilityLabel, availabilityTone } from "@/lib/status";
import type { IsoDate, IsoTime } from "@/lib/types/common";
import type { TrainerAvailabilitySlot } from "@/lib/types/trainers";

/** Una fila por bloque del horario del club; `slot` es `null` si no está registrado. */
interface AvailabilityRow {
  startTime: IsoTime;
  slot: TrainerAvailabilitySlot | null;
}

export interface AvailabilityBoardProps {
  slots: TrainerAvailabilitySlot[];
  /** Fecha calculada en el servidor para evitar desajustes de hidratación. */
  today: IsoDate;
}

export function AvailabilityBoard({ slots, today }: AvailabilityBoardProps) {
  const router = useRouter();

  const [date, setDate] = useState<IsoDate>(today);
  const [dateOpen, setDateOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStart, setDialogStart] = useState<IsoTime | null>(null);
  const [selected, setSelected] = useState<TrainerAvailabilitySlot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const rows = useMemo<AvailabilityRow[]>(() => {
    const registeredSlots = slots
      .filter((slot) => slot.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const registeredStarts = new Set(registeredSlots.map((slot) => slot.startTime));

    // Las horas sin registrar completan el horario del club; los bloques
    // fuera de ese horario (registrados por API) se listan igualmente para
    // poder eliminarlos.
    const emptyRows: AvailabilityRow[] = AVAILABILITY_START_OPTIONS.filter(
      (startTime) => !registeredStarts.has(startTime)
    ).map((startTime) => ({ startTime, slot: null }));

    return [
      ...registeredSlots.map((slot) => ({ startTime: slot.startTime, slot })),
      ...emptyRows,
    ].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [slots, date]);

  const registered = rows.filter((row) => row.slot !== null);
  const freeCount = registered.filter((row) => row.slot?.isBooked === false).length;
  const bookedCount = registered.filter((row) => row.slot?.isBooked === true).length;

  const takenStartTimes = [...new Set(registered.map((row) => row.startTime))];

  async function handleDelete() {
    if (!selected) return;
    setPending(true);
    const result = await deleteAvailabilityAction(selected.slotId);
    setPending(false);

    if (!result.ok) {
      const refreshable = result.code === "conflict" || result.code === "not-found";
      toast.error(result.message, {
        action: refreshable
          ? { label: "Actualizar", onClick: () => router.refresh() }
          : undefined,
      });
      if (refreshable) {
        setConfirmOpen(false);
        router.refresh();
      }
      return;
    }

    toast.success("Bloque eliminado.");
    setConfirmOpen(false);
    router.refresh();
  }

  const columns: DataTableColumn<AvailabilityRow>[] = [
    {
      key: "block",
      header: "Bloque",
      cell: (row) => (
        <span className="font-medium">
          {formatAvailabilityRange(row.startTime)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (row) =>
        row.slot ? (
          <StatusBadge
            label={availabilityLabel(row.slot.isBooked)}
            tone={availabilityTone(row.slot.isBooked)}
          />
        ) : (
          <span className="text-muted-foreground text-xs">Sin registrar</span>
        ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      className: "w-28 text-right",
      headerClassName: "w-28",
      cell: (row) =>
        row.slot ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected(row.slot);
              setConfirmOpen(true);
            }}
          >
            <Trash2 />
            Eliminar
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDialogStart(row.startTime);
              setDialogOpen(true);
            }}
          >
            <CalendarPlus />
            Registrar
          </Button>
        ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base capitalize">
                {formatLongDate(date)}
              </CardTitle>
              <CardDescription>
                {registered.length === 0
                  ? "No tienes bloques registrados este día."
                  : `${registered.length} bloque(s) registrados · ${freeCount} libre(s) · ${bookedCount} reservado(s)`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <CalendarIcon />
                    {formatDate(date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={isoToLocalDate(date)}
                    onSelect={(value) => {
                      if (!value) return;
                      setDate(dateToIso(value));
                      setDateOpen(false);
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setDialogStart(null);
                  setDialogOpen(true);
                }}
              >
                <CalendarPlus />
                Nuevo bloque
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.startTime}
            caption="Horario del club: 06:00 a 21:00 en bloques de 60 minutos."
            emptyMessage="No hay bloques en el horario del club."
          />
        </CardContent>
      </Card>

      <AvailabilitySlotDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={date}
        defaultStartTime={dialogStart}
        takenStartTimes={takenStartTimes}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!pending) setConfirmOpen(next);
        }}
        title="Eliminar bloque"
        description={
          selected
            ? `Se eliminará el bloque del ${formatDate(selected.date)} de ${formatAvailabilityRange(
                selected.startTime
              )}. Los miembros ya no podrán agendarlo.`
            : "Se eliminará el bloque seleccionado."
        }
        confirmLabel="Eliminar bloque"
        cancelLabel="Volver"
        destructive
        pending={pending}
        onConfirm={handleDelete}
      />
    </>
  );
}
