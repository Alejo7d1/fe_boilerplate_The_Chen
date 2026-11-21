"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { CircleAlert, CreditCard, Lock } from "lucide-react";

import { processPaymentAction } from "@/app/actions/payments";
import { PaymentReceipt } from "@/components/payments/payment-receipt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  formatCardNumberInput,
  formatExpiryInput,
  validateCardNumber,
  validateCvv,
  validateExpiry,
  validateHolder,
} from "@/lib/payment-card";
import type { PaymentReceipt as PaymentReceiptData } from "@/lib/types/payments";

type FieldName = "holder" | "cardNumber" | "expiry" | "cvv";
type FieldErrors = Partial<Record<FieldName, string>>;

export interface PaymentFormProps {
  chargeId: string;
}

/**
 * H10 · Formulario de cobro. Valida en vivo y, tras el `200`, se reemplaza por
 * el comprobante (no permite reenviar el mismo cobro).
 */
export function PaymentForm({ chargeId }: PaymentFormProps) {
  const id = useId();
  const [holder, setHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null);
  const [pending, startTransition] = useTransition();

  const errors: Record<FieldName, string | null> = {
    holder: validateHolder(holder),
    cardNumber: validateCardNumber(cardNumber),
    expiry: validateExpiry(expiry),
    cvv: validateCvv(cvv),
  };

  function errorFor(field: FieldName) {
    if (serverErrors[field]) return [{ message: serverErrors[field] }];
    if (!touched[field] || !errors[field]) return undefined;
    return [{ message: errors[field] }];
  }

  function touch(field: FieldName) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function clearServerError(field: FieldName) {
    setServerErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setTouched({ holder: true, cardNumber: true, expiry: true, cvv: true });

    if (Object.values(errors).some(Boolean)) {
      setFormError("Revisa los datos de la tarjeta.");
      return;
    }

    startTransition(async () => {
      const result = await processPaymentAction({
        chargeId,
        holder,
        cardNumber,
        expiry,
        cvv,
      });

      if (!result.ok) {
        setServerErrors(result.fieldErrors ?? {});
        setFormError(result.message);
        return;
      }

      setServerErrors({});
      setReceipt(result.receipt);
    });
  }

  if (receipt) return <PaymentReceipt receipt={receipt} />;

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" aria-hidden />
            Datos de la tarjeta
          </CardTitle>
          <CardDescription>
            Cobro <span className="font-mono text-xs">{chargeId}</span>. Los datos de la
            tarjeta no se guardan en el club.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {formError ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>No se pudo procesar el cobro</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${id}-holder`}>Titular de la tarjeta</FieldLabel>
              <Input
                id={`${id}-holder`}
                value={holder}
                onChange={(event) => {
                  setHolder(event.target.value);
                  clearServerError("holder");
                }}
                onBlur={() => touch("holder")}
                maxLength={100}
                autoComplete="cc-name"
                placeholder="Como aparece en la tarjeta"
                disabled={pending}
                aria-invalid={Boolean(errorFor("holder"))}
              />
              <FieldError errors={errorFor("holder")} />
            </Field>

            <Field>
              <FieldLabel htmlFor={`${id}-number`}>Número de tarjeta</FieldLabel>
              <Input
                id={`${id}-number`}
                value={cardNumber}
                onChange={(event) => {
                  setCardNumber(formatCardNumberInput(event.target.value));
                  clearServerError("cardNumber");
                }}
                onBlur={() => touch("cardNumber")}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="16 dígitos"
                disabled={pending}
                aria-invalid={Boolean(errorFor("cardNumber"))}
              />
              <FieldError errors={errorFor("cardNumber")} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${id}-expiry`}>Vencimiento</FieldLabel>
                <Input
                  id={`${id}-expiry`}
                  value={expiry}
                  onChange={(event) => {
                    setExpiry(formatExpiryInput(event.target.value));
                    clearServerError("expiry");
                  }}
                  onBlur={() => touch("expiry")}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  disabled={pending}
                  aria-invalid={Boolean(errorFor("expiry"))}
                />
                <FieldError errors={errorFor("expiry")} />
              </Field>

              <Field>
                <FieldLabel htmlFor={`${id}-cvv`}>CVV</FieldLabel>
                <Input
                  id={`${id}-cvv`}
                  value={cvv}
                  onChange={(event) => {
                    setCvv(event.target.value.replace(/\D/g, "").slice(0, 4));
                    clearServerError("cvv");
                  }}
                  onBlur={() => touch("cvv")}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="3 o 4 dígitos"
                  disabled={pending}
                  aria-invalid={Boolean(errorFor("cvv"))}
                />
                <FieldError errors={errorFor("cvv")} />
              </Field>
            </div>
          </FieldGroup>

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? <Spinner aria-label="Procesando el cobro" /> : <Lock />}
            Pagar
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
