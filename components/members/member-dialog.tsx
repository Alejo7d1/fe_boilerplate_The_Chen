"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { createMemberAction } from "@/app/actions/members";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { IDLE_FORM_STATE, type FormState } from "@/lib/actions/form-state";

export interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberDialog({ open, onOpenChange }: MemberDialogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createMemberAction,
    IDLE_FORM_STATE
  );
  const handled = useRef<FormState | null>(null);

  useEffect(() => {
    if (!state.success || handled.current === state) return;
    handled.current = state;
    toast.success("Miembro registrado.");
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
          <DialogTitle>Nuevo miembro</DialogTitle>
          <DialogDescription>
            El miembro se crea con rol MIEMBRO y un carné propio. Después podrás
            registrarle una membresía.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-5">
          {state.error ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>No se pudo registrar</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="member-name">Nombre completo</FieldLabel>
              <Input
                id="member-name"
                name="name"
                placeholder="Ana López"
                maxLength={80}
                autoComplete="name"
                required
              />
              <FieldError
                errors={
                  state.fieldErrors?.name ? [{ message: state.fieldErrors.name }] : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="member-email">Correo electrónico</FieldLabel>
              <Input
                id="member-email"
                name="email"
                type="email"
                placeholder="ana@correo.com"
                autoComplete="email"
                required
              />
              <FieldError
                errors={
                  state.fieldErrors?.email
                    ? [{ message: state.fieldErrors.email }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="member-password">Contraseña inicial</FieldLabel>
              <Input
                id="member-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
              <FieldDescription>
                El miembro la usará para iniciar sesión. Mínimo 6 caracteres.
              </FieldDescription>
              <FieldError
                errors={
                  state.fieldErrors?.password
                    ? [{ message: state.fieldErrors.password }]
                    : undefined
                }
              />
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
              {pending ? <Spinner aria-label="Registrando miembro" /> : null}
              Registrar miembro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
