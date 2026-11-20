"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cancelClassAction } from "@/app/actions/classes";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import type { ClassSession } from "@/lib/types/classes";

export interface CancelClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ClassSession | null;
}

export function CancelClassDialog({ open, onOpenChange, session }: CancelClassDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    if (!session) return;
    setPending(true);
    const result = await cancelClassAction(session.id, reason);
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      if (result.code === "not-found" || result.code === "conflict") router.refresh();
      return;
    }

    toast.success(`Clase «${session.name}» cancelada.`);
    setReason("");
    setError(null);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) setError(null);
        onOpenChange(next);
      }}
      title="Cancelar clase"
      description={
        <span className="flex flex-col gap-2">
          <span>
            {session
              ? `Se cancelará «${session.name}» del ${formatDate(session.date)} a las ${session.startTime}.`
              : "Se cancelará la clase seleccionada."}{" "}
            Los miembros con reserva activa quedarán sin cupo.
          </span>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo de la cancelación"
            rows={3}
            aria-label="Motivo de la cancelación"
            disabled={pending}
          />
          {error ? <span className="text-destructive text-sm">{error}</span> : null}
        </span>
      }
      confirmLabel="Cancelar clase"
      cancelLabel="Volver"
      destructive
      pending={pending}
      onConfirm={handleConfirm}
    />
  );
}
