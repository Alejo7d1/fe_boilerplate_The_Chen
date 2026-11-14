"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { savePlanAction } from "@/app/actions/plans";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { IDLE_FORM_STATE, type FormState } from "@/lib/actions/form-state";
import type { MembershipPlan } from "@/lib/types/plans";

export interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` crea un plan nuevo; un plan abre la edición. */
  plan: MembershipPlan | null;
}

export function PlanDialog({ open, onOpenChange, plan }: PlanDialogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(savePlanAction, IDLE_FORM_STATE);
  const [unlimited, setUnlimited] = useState(plan?.classesIncluded === null);
  const handled = useRef<FormState | null>(null);

  useEffect(() => {
    if (!state.success || handled.current === state) return;
    handled.current = state;
    toast.success(plan ? "Plan actualizado." : "Plan creado.");
    onOpenChange(false);
    router.refresh();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? "Editar plan" : "Nuevo plan"}</DialogTitle>
          <DialogDescription>
            {plan
              ? "Actualiza los datos del plan. Los cambios aplican a las próximas compras."
              : "Define nombre, precio, duración y clases incluidas del plan."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-5">
          {plan ? <input type="hidden" name="id" value={plan.id} /> : null}

          {state.error ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>No se pudo guardar</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="plan-name">Nombre</FieldLabel>
              <Input
                id="plan-name"
                name="name"
                defaultValue={plan?.name}
                maxLength={60}
                placeholder="Mensual clásico"
                required
              />
              <FieldError
                errors={
                  state.fieldErrors?.name ? [{ message: state.fieldErrors.name }] : undefined
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="plan-price">Precio</FieldLabel>
                <Input
                  id="plan-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={plan?.price}
                  placeholder="250"
                  required
                />
                <FieldError
                  errors={
                    state.fieldErrors?.price
                      ? [{ message: state.fieldErrors.price }]
                      : undefined
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="plan-duration">Duración (días)</FieldLabel>
                <Input
                  id="plan-duration"
                  name="durationDays"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={plan?.durationDays}
                  placeholder="30"
                  required
                />
                <FieldError
                  errors={
                    state.fieldErrors?.durationDays
                      ? [{ message: state.fieldErrors.durationDays }]
                      : undefined
                  }
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="plan-classes">Clases incluidas</FieldLabel>
              <Input
                id="plan-classes"
                name="classesIncluded"
                type="number"
                min="1"
                step="1"
                disabled={unlimited}
                defaultValue={plan?.classesIncluded ?? undefined}
                placeholder="12"
              />
              <FieldError
                errors={
                  state.fieldErrors?.classesIncluded
                    ? [{ message: state.fieldErrors.classesIncluded }]
                    : undefined
                }
              />
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="plan-unlimited"
                name="unlimited"
                checked={unlimited}
                onCheckedChange={(value) => setUnlimited(value === true)}
              />
              <FieldLabel htmlFor="plan-unlimited" className="font-normal">
                Clases ilimitadas
              </FieldLabel>
            </Field>
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
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner aria-label="Guardando plan" /> : null}
              {plan ? "Guardar cambios" : "Crear plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
