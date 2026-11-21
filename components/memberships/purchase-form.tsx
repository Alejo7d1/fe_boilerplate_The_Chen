"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";

import {
  purchaseMembershipAction,
  searchMembersAction,
} from "@/app/actions/memberships";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { IDLE_FORM_STATE, type FormState } from "@/lib/actions/form-state";
import {
  formatClassesRemaining,
  formatCurrency,
} from "@/lib/format";
import type { MemberSummary } from "@/lib/types/members";
import type { MembershipPlan } from "@/lib/types/plans";

const NO_PLAN = "";

export interface PurchaseFormProps {
  plans: MembershipPlan[];
}

export function PurchaseForm({ plans }: PurchaseFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    purchaseMembershipAction,
    IDLE_FORM_STATE
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualId, setManualId] = useState("");
  const [planId, setPlanId] = useState(NO_PLAN);
  const handled = useRef<FormState | null>(null);

  const runSearch = useCallback(async (term: string) => {
    setSearching(true);
    setSearchError(null);
    const result = await searchMembersAction(term);
    setSearching(false);
    if ("error" in result) {
      setResults([]);
      setSearchError(result.error);
      return;
    }
    setResults(result.members);
  }, []);

  useEffect(() => {
    if (manualMode) return;
    const term = query.trim();
    if (!term) return;
    const timer = setTimeout(() => {
      void runSearch(term);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, manualMode, runSearch]);

  useEffect(() => {
    if (!state.success || handled.current === state) return;
    handled.current = state;
    toast.success("Membresía registrada correctamente.");
    setMember(null);
    setManualId("");
    setQuery("");
    setResults([]);
    setPlanId(NO_PLAN);
    router.refresh();
  }, [state, router]);

  const selectedPlan = plans.find((plan) => plan.id === planId) ?? null;
  const memberId = member?.id ?? manualId.trim();
  const canSubmit = Boolean(memberId) && Boolean(selectedPlan);

  return (
    <form action={formAction} className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="planId" value={selectedPlan?.id ?? ""} />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Miembro</CardTitle>
            <CardDescription>
              Busca por nombre o correo, o ingresa el identificador si la búsqueda no
              está disponible.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {member ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-muted-foreground size-4" aria-hidden />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{member.name || "Sin nombre"}</span>
                    <span className="text-muted-foreground text-xs">
                      {member.email ?? member.id}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMember(null);
                    setQuery("");
                  }}
                >
                  Cambiar
                </Button>
              </div>
            ) : manualMode ? (
              <Field>
                <FieldLabel htmlFor="member-manual">Identificador del miembro</FieldLabel>
                <Input
                  id="member-manual"
                  value={manualId}
                  onChange={(event) => setManualId(event.target.value)}
                  placeholder="UUID o número de socio"
                />
                <FieldError
                  errors={
                    state.fieldErrors?.memberId
                      ? [{ message: state.fieldErrors.memberId }]
                      : undefined
                  }
                />
              </Field>
            ) : (
              <Field>
                <FieldLabel htmlFor="member-search">Buscar miembro</FieldLabel>
                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="member-search"
                    value={query}
                    onChange={(event) => {
                      const value = event.target.value;
                      setQuery(value);
                      if (!value.trim()) {
                        setResults([]);
                        setSearchError(null);
                      }
                    }}
                    placeholder="Nombre o correo"
                    className="pl-9"
                    autoComplete="off"
                  />
                  {searching ? (
                    <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                  ) : null}
                </div>
                <FieldError
                  errors={
                    state.fieldErrors?.memberId
                      ? [{ message: state.fieldErrors.memberId }]
                      : undefined
                  }
                />

                {searchError ? (
                  <Alert variant="destructive" className="mt-2">
                    <CircleAlert />
                    <AlertTitle>Búsqueda no disponible</AlertTitle>
                    <AlertDescription className="flex flex-col items-start gap-2">
                      <span>{searchError}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setManualMode(true);
                          setResults([]);
                        }}
                      >
                        Ingresar identificador manualmente
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : null}

                {!searchError && query.trim() && !searching ? (
                  results.length === 0 ? (
                    <p className="text-muted-foreground mt-2 text-sm">
                      Sin coincidencias para «{query.trim()}».
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-col divide-y rounded-lg border">
                      {results.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="hover:bg-muted/60 flex w-full flex-col items-start px-3 py-2 text-left"
                            onClick={() => {
                              setMember(item);
                              setResults([]);
                            }}
                          >
                            <span className="text-sm font-medium">{item.name || "Sin nombre"}</span>
                            <span className="text-muted-foreground text-xs">
                              {item.email ?? item.id}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )
                ) : null}
              </Field>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
            <CardDescription>Selecciona el plan que se va a comprar o renovar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="plan-select">Plan de membresía</FieldLabel>
              {plans.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No hay planes creados. Créalos en el módulo de planes antes de registrar
                  una compra.
                </p>
              ) : (
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger id="plan-select" className="w-full">
                    <SelectValue placeholder="Elige un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id} disabled={!plan.active}>
                        {plan.name}
                        {plan.active ? "" : " · inactivo"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FieldError
                errors={
                  state.fieldErrors?.planId
                    ? [{ message: state.fieldErrors.planId }]
                    : undefined
                }
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
          <CardDescription>Revisa los datos antes de confirmar.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Miembro</span>
            <span className="text-right font-medium">
              {member?.name || manualId || "Sin seleccionar"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Plan</span>
            <span className="text-right font-medium">
              {selectedPlan?.name ?? "Sin seleccionar"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Precio</span>
            <span className="text-right font-medium">
              {selectedPlan ? formatCurrency(selectedPlan.price) : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Duración</span>
            <span className="text-right font-medium">
              {selectedPlan ? `${selectedPlan.durationDays} días` : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Clases incluidas</span>
            <span className="text-right font-medium">
              {selectedPlan
                ? formatClassesRemaining(selectedPlan.classesIncluded)
                : "—"}
            </span>
          </div>

          {state.error && !state.fieldErrors ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>No se pudo registrar la compra</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" disabled={!canSubmit || pending} className="mt-1">
            {pending ? <Spinner aria-label="Registrando compra" /> : null}
            Confirmar compra
          </Button>
          {!canSubmit ? (
            <p className="text-muted-foreground text-xs">
              Selecciona un miembro y un plan para continuar.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </form>
  );
}
