"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Search, UserCheck } from "lucide-react";

import { searchRoutineMembersAction } from "@/app/actions/training";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { MemberSummary } from "@/lib/types/members";

export interface MemberSelectorProps {
  selected: MemberSummary | null;
  manualId: string;
  onSelect: (member: MemberSummary) => void;
  onClear: () => void;
  onManualIdChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * H12 · Selector de cliente. Intenta buscar contra `GET /api/users`; ese
 * endpoint exige `RECEPCION_ADMIN`, así que ante un `403` se informa y se
 * habilita la captura manual del identificador.
 */
export function MemberSelector({
  selected,
  manualId,
  onSelect,
  onClear,
  onManualIdChange,
  error,
  disabled,
}: MemberSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchedTerm, setSearchedTerm] = useState("");
  const [searchError, setSearchError] = useState<{
    message: string;
    code?: string;
  } | null>(null);
  const [manualMode, setManualMode] = useState(false);
  /** Tras un 403 no se repite la consulta: el backend no cambiará de opinión. */
  const [blocked, setBlocked] = useState(false);

  const runSearch = useCallback(async (term: string) => {
    setSearching(true);
    const result = await searchRoutineMembersAction(term);
    setSearching(false);
    setSearchedTerm(term);
    if (!result.ok) {
      setResults([]);
      setSearchError({ message: result.message, code: result.code });
      if (result.code === "forbidden") setBlocked(true);
      return;
    }
    setSearchError(null);
    setResults(result.members);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term || manualMode || blocked) return;
    const timer = setTimeout(() => void runSearch(term), 350);
    return () => clearTimeout(timer);
  }, [query, manualMode, blocked, runSearch]);

  if (selected) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <UserCheck className="text-muted-foreground size-4" aria-hidden />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{selected.name || selected.id}</span>
              <span className="text-muted-foreground text-xs">
                {selected.cardNumber ?? selected.email ?? selected.id}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={disabled}
          >
            Cambiar
          </Button>
        </div>
        {error ? <p className="text-destructive text-xs">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {manualMode ? (
        <Field>
          <FieldLabel htmlFor="routine-member-manual">Identificador del miembro</FieldLabel>
          <Input
            id="routine-member-manual"
            value={manualId}
            onChange={(event) => onManualIdChange(event.target.value)}
            placeholder="UUID del miembro"
            autoComplete="off"
            disabled={disabled}
          />
          <FieldError errors={error ? [{ message: error }] : undefined} />
        </Field>
      ) : (
        <Field>
          <FieldLabel htmlFor="routine-member-search">Buscar cliente</FieldLabel>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="routine-member-search"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                if (!value.trim()) {
                  setResults([]);
                  setSearchError(null);
                  setSearchedTerm("");
                }
              }}
              placeholder="Nombre, correo o carné"
              className="pl-9"
              autoComplete="off"
              disabled={disabled}
            />
            {searching ? (
              <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            ) : null}
          </div>
          <FieldError errors={error ? [{ message: error }] : undefined} />
        </Field>
      )}

      {searchError ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>
            {searchError.code === "forbidden"
              ? "Tu rol no puede consultar el padrón"
              : "Búsqueda no disponible"}
          </AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            <span>
              {searchError.code === "forbidden"
                ? "El backend solo permite listar miembros a recepción/administración. Pide el identificador del miembro a recepción y captúralo aquí."
                : searchError.message}
            </span>
            {manualMode ? null : (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setManualMode(true);
                  setResults([]);
                  setSearchError(null);
                }}
              >
                Ingresar identificador manualmente
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      {!manualMode && !searchError && searchedTerm && searchedTerm === query.trim() ? (
        results.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Sin coincidencias para «{searchedTerm}».
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {results.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  className="hover:bg-muted/60 flex w-full flex-col items-start px-3 py-2 text-left"
                  onClick={() => {
                    onSelect(member);
                    setQuery("");
                    setResults([]);
                    setSearchedTerm("");
                  }}
                >
                  <span className="text-sm font-medium">{member.name || member.id}</span>
                  <span className="text-muted-foreground text-xs">
                    {member.cardNumber ?? member.email ?? member.id}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
