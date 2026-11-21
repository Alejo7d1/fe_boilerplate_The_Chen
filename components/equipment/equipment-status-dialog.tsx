"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { updateEquipmentStatusAction } from "@/app/actions/equipment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { equipmentTone } from "@/lib/status";
import {
  EQUIPMENT_STATUSES,
  type Equipment,
  type EquipmentStatus,
} from "@/lib/types/equipment";

const MAX_REASON = 200;
const MIN_REASON = 5;

export interface EquipmentStatusDialogProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentStatusDialog({
  equipment,
  open,
  onOpenChange,
}: EquipmentStatusDialogProps) {
  const router = useRouter();
  const [status, setStatus] = useState<EquipmentStatus>(equipment.status);
  const [reason, setReason] = useState(equipment.reason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const needsReason = status !== "Operativa";
  const unchanged =
    status === equipment.status && reason.trim() === (equipment.reason ?? "");

  function handleSubmit() {
    setError(null);
    if (needsReason && reason.trim().length < MIN_REASON) {
      setError(`Indica el motivo (mínimo ${MIN_REASON} caracteres).`);
      return;
    }

    startTransition(async () => {
      const result = await updateEquipmentStatusAction(
        equipment.id,
        status,
        needsReason ? reason : ""
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success(`«${equipment.name}» quedó en ${status}.`);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estado de {equipment.name}</DialogTitle>
          <DialogDescription>
            El cambio queda registrado con tu usuario. El motivo es obligatorio cuando la
            máquina no está operativa.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-destructive flex items-start gap-2 text-sm" role="alert">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="equipment-status">Estado</FieldLabel>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as EquipmentStatus)}
              disabled={pending}
            >
              <SelectTrigger id="equipment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Vista previa:</span>
              <Badge variant={equipmentTone(status)}>{status}</Badge>
            </div>
          </Field>

          {needsReason ? (
            <Field>
              <FieldLabel htmlFor="equipment-reason">Motivo</FieldLabel>
              <Textarea
                id="equipment-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value.slice(0, MAX_REASON))}
                maxLength={MAX_REASON}
                rows={3}
                disabled={pending}
                placeholder="Cambio de banda, revisión eléctrica…"
              />
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>
                  Entre {MIN_REASON} y {MAX_REASON} caracteres.
                </span>
                <span>
                  {reason.length}/{MAX_REASON}
                </span>
              </div>
              <FieldError
                errors={
                  needsReason && reason.trim().length < MIN_REASON
                    ? [{ message: "El motivo es obligatorio." }]
                    : undefined
                }
              />
            </Field>
          ) : null}
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={pending || unchanged}>
            {pending ? <Spinner aria-label="Guardando estado" /> : null}
            Guardar estado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
