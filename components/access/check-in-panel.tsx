"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, OctagonAlert } from "lucide-react";

import { checkInAction, type CheckInState } from "@/app/actions/access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const IDLE: CheckInState = {};

const BANNER_TONES = {
  granted: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  exception: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  denied: "border-destructive/40 bg-destructive/10 text-destructive",
} as const;

export function CheckInPanel() {
  const [state, formAction, pending] = useActionState(checkInAction, IDLE);
  const [allowException, setAllowException] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef<CheckInState | null>(null);

  useEffect(() => {
    if (!state.outcome || handled.current === state) return;
    handled.current = state;
    formRef.current?.reset();
    setAllowException(false);
  }, [state]);

  const denied = state.code === "forbidden";
  const outcome = state.outcome;

  return (
    <div className="flex max-w-xl flex-col gap-4">
      {outcome ? (
        <div
          role="status"
          className={cn(
            "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium",
            outcome.result === "Excepcion" ? BANNER_TONES.exception : BANNER_TONES.granted
          )}
        >
          {outcome.result === "Excepcion" ? (
            <>
              <OctagonAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                Acceso Concedido por Excepción · {outcome.memberName}
              </span>
            </>
          ) : (
            <>
              <CircleCheck className="mt-0.5 size-4 shrink-0" />
              <span>Acceso Autorizado · {outcome.memberName}</span>
            </>
          )}
        </div>
      ) : null}

      {denied ? (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium",
            BANNER_TONES.denied
          )}
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{state.error ?? "Membresía Vencida"}</span>
        </div>
      ) : null}

      {state.error && !denied ? (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium",
            BANNER_TONES.denied
          )}
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <form ref={formRef} action={formAction} className="flex flex-col gap-5">
        <input
          type="hidden"
          name="allowException"
          value={allowException ? "true" : "false"}
        />

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="check-in-card">Carné o nombre del miembro</FieldLabel>
            <Input
              id="check-in-card"
              name="cardNumber"
              placeholder="MEM-2026-0042"
              autoComplete="off"
              autoFocus
              required
              disabled={pending}
            />
            <FieldError
              errors={
                state.fieldErrors?.cardNumber
                  ? [{ message: state.fieldErrors.cardNumber }]
                  : undefined
              }
            />
          </Field>

          <Field orientation="horizontal">
            <Switch
              id="check-in-exception"
              checked={allowException}
              onCheckedChange={setAllowException}
              disabled={pending || !denied}
              aria-describedby="check-in-exception-hint"
            />
            <div className="flex flex-col gap-0.5">
              <FieldLabel htmlFor="check-in-exception" className="font-normal">
                Autorizar por Excepción
              </FieldLabel>
              <p id="check-in-exception-hint" className="text-muted-foreground text-xs">
                Se habilita solo cuando el sistema rechaza una membresía vencida.
              </p>
            </div>
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? <Spinner aria-label="Registrando ingreso" /> : null}
          Registrar Ingreso
        </Button>
      </form>
    </div>
  );
}
