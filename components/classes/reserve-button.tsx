"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { reserveSeatAction } from "@/app/actions/classes";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ClassSession } from "@/lib/types/classes";

export interface ReserveButtonProps {
  session: ClassSession;
  freeSeats: number;
}

export function ReserveButton({ session, freeSeats }: ReserveButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const soldOut = freeSeats <= 0;
  const disabled = soldOut || pending || submitting;

  function handleReserve() {
    if (disabled) return;
    setSubmitting(true);
    startTransition(async () => {
      const result = await reserveSeatAction(session.id);
      setSubmitting(false);
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
        if (result.code === "conflict") router.refresh();
        return;
      }
      toast.success(`Reserva confirmada para ${session.name}.`);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleReserve}
      disabled={disabled}
      aria-busy={pending || submitting}
    >
      {pending || submitting ? <Spinner aria-label="Reservando" /> : null}
      {soldOut ? "Sin cupos" : "Reservar"}
    </Button>
  );
}
