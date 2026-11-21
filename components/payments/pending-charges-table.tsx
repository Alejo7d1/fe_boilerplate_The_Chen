"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Receipt,
  RotateCcw,
  Search,
  UserCheck,
} from "lucide-react";

import {
  listPendingChargesAction,
  searchChargeMembersAction,
} from "@/app/actions/payments";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MemberSummary } from "@/lib/types/members";
import {
  PENDING_CHARGES_PAGE_SIZE,
  type PendingCharge,
  type PendingChargesPage,
} from "@/lib/types/payments";

interface MemberFilterProps {
  selected: MemberSummary | null;
  onSelect: (member: MemberSummary) => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Buscador por nombre o carné contra `GET /api/users?role=MIEMBRO&search=`.
 * Sin término no consulta: evita listar todo el padrón en el filtro.
 */
function MemberFilter({ selected, onSelect, onClear, disabled }: MemberFilterProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchedTerm, setSearchedTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (!term) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await searchChargeMembersAction(term);
      if (cancelled) return;
      setSearching(false);
      setSearchedTerm(term);
      if (!result.ok) {
        setResults([]);
        setError(result.message);
        return;
      }
      setError(null);
      setResults(result.members);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  if (selected) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-md border px-3 lg:max-w-xs">
        <UserCheck className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <span className="truncate text-sm">
          {selected.name || selected.email || selected.id}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2"
          onClick={onClear}
          disabled={disabled}
        >
          Cambiar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 lg:max-w-xs">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (!value.trim()) {
              setResults([]);
              setError(null);
            }
          }}
          placeholder="Buscar miembro por nombre o carné"
          className="pl-9"
          aria-label="Buscar miembro"
          autoComplete="off"
          disabled={disabled}
        />
        {searching ? (
          <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        ) : null}
      </div>

      {error ? <p className="text-destructive text-xs">{error}</p> : null}

      {!error && query.trim() && searchedTerm === query.trim() ? (
        results.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Sin coincidencias para «{query.trim()}».
          </p>
        ) : (
          <ul className="bg-popover z-10 flex flex-col divide-y rounded-lg border">
            {results.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  className="hover:bg-muted/60 flex w-full flex-col items-start px-3 py-2 text-left"
                  onClick={() => {
                    onSelect(member);
                    setQuery("");
                    setResults([]);
                  }}
                >
                  <span className="text-sm font-medium">
                    {member.name || member.email || member.id}
                  </span>
                  {member.cardNumber ? (
                    <span className="text-muted-foreground font-mono text-xs">
                      {member.cardNumber}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}

export interface PendingChargesTableProps {
  page: PendingChargesPage;
}

/** H11 · Tabla paginada con filtros por miembro y rango de fechas. */
export function PendingChargesTable({ page }: PendingChargesTableProps) {
  const [data, setData] = useState(page);
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasFilters = Boolean(member) || Boolean(startDate) || Boolean(endDate);

  const reload = useCallback(
    (
      nextMember: MemberSummary | null,
      nextStart: string,
      nextEnd: string,
      targetPage: number
    ) => {
      setMember(nextMember);
      setStartDate(nextStart);
      setEndDate(nextEnd);

      startTransition(async () => {
        const result = await listPendingChargesAction({
          page: targetPage,
          limit: PENDING_CHARGES_PAGE_SIZE,
          memberId: nextMember?.id,
          startDate: nextStart || undefined,
          endDate: nextEnd || undefined,
        });

        if (!result.ok) {
          setError(result.message);
          return;
        }
        setError(null);
        setData(result.page);
      });
    },
    []
  );

  const columns: DataTableColumn<PendingCharge>[] = useMemo(
    () => [
      {
        key: "member",
        header: "Miembro",
        cell: (charge) => (
          <span className="flex flex-col">
            <span className="font-medium">{charge.memberName ?? "—"}</span>
            {charge.memberCardNumber ? (
              <span className="text-muted-foreground font-mono text-xs">
                {charge.memberCardNumber}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        key: "concept",
        header: "Concepto",
        cell: (charge) => charge.concept ?? "—",
      },
      {
        key: "amount",
        header: "Monto",
        className: "text-right whitespace-nowrap",
        headerClassName: "text-right",
        cell: (charge) => formatCurrency(charge.amount),
      },
      {
        key: "date",
        header: "Fecha",
        cell: (charge) => (charge.dueDate ? formatDate(charge.dueDate) : "—"),
      },
      {
        key: "status",
        header: "Estado",
        cell: (charge) =>
          charge.status ? <Badge variant="secondary">{charge.status}</Badge> : "—",
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start">
        <MemberFilter
          selected={member}
          onSelect={(next) => reload(next, startDate, endDate, 1)}
          onClear={() => reload(null, startDate, endDate, 1)}
          disabled={pending}
        />

        <Input
          type="date"
          value={startDate}
          onChange={(event) => reload(member, event.target.value, endDate, 1)}
          className="lg:w-44"
          aria-label="Fecha inicial"
          disabled={pending}
        />
        <Input
          type="date"
          value={endDate}
          onChange={(event) => reload(member, startDate, event.target.value, 1)}
          className="lg:w-44"
          aria-label="Fecha final"
          disabled={pending}
        />

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => reload(null, "", "", 1)}
            disabled={pending}
          >
            <RotateCcw />
            Limpiar filtros
          </Button>
        ) : null}

        {pending ? <Spinner aria-label="Actualizando cobros" className="ml-auto" /> : null}
      </div>

      {error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>No se pudo actualizar el listado</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!hasFilters && data.charges.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No hay pagos pendientes registrados"
          description="Cuando recepción registre una compra o renovación, el cobro aparecerá aquí."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data.charges}
          getRowKey={(charge) => charge.id}
          emptyMessage="Ningún cobro coincide con los filtros."
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {data.total} {data.total === 1 ? "cobro" : "cobros"} · página {data.page} de{" "}
          {data.totalPages}
        </p>
        {data.totalPages > 1 ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pending || data.page <= 1}
              onClick={() => reload(member, startDate, endDate, data.page - 1)}
            >
              <ChevronLeft />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pending || data.page >= data.totalPages}
              onClick={() => reload(member, startDate, endDate, data.page + 1)}
            >
              Siguiente
              <ChevronRight />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
