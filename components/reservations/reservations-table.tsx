"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelReservationAction } from "@/app/actions/reservations";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { reservationTone } from "@/lib/status";
import type { ClassReservation } from "@/lib/types/classes";

export function ReservationsTable({ reservations }: { reservations: ClassReservation[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ClassReservation | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!selected) return;
    setPending(true);
    const result = await cancelReservationAction(selected.id);
    setPending(false);

    if (!result.ok) {
      toast.error(result.message, {
        action:
          result.code === "not-found" || result.code === "conflict"
            ? { label: "Actualizar", onClick: () => router.refresh() }
            : undefined,
      });
      if (result.code === "not-found" || result.code === "conflict") {
        setOpen(false);
        router.refresh();
      }
      return;
    }

    toast.success("Reserva cancelada.");
    setOpen(false);
    router.refresh();
  }

  const columns: DataTableColumn<ClassReservation>[] = [
    {
      key: "class",
      header: "Clase",
      cell: (reservation) => (
        <span className="font-medium">{reservation.name}</span>
      ),
    },
    {
      key: "date",
      header: "Fecha",
      cell: (reservation) => formatDate(reservation.date),
    },
    {
      key: "time",
      header: "Hora",
      cell: (reservation) => reservation.startTime,
    },
    {
      key: "status",
      header: "Estado",
      cell: (reservation) => (
        <StatusBadge
          label={reservation.status}
          tone={reservationTone(reservation.status)}
        />
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      className: "w-28 text-right",
      headerClassName: "w-28",
      cell: (reservation) =>
        reservation.status === "Activa" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected(reservation);
              setOpen(true);
            }}
          >
            Cancelar
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={reservations}
        getRowKey={(reservation) => reservation.id}
        emptyMessage="No tienes reservas registradas."
      />

      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
        title="Cancelar reserva"
        description={
          selected
            ? `Se cancelará tu reserva de «${selected.name}» del ${formatDate(
                selected.date
              )} a las ${selected.startTime}.`
            : "Se cancelará la reserva seleccionada."
        }
        confirmLabel="Cancelar reserva"
        cancelLabel="Volver"
        destructive
        pending={pending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
