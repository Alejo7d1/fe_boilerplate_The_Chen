import type { Metadata } from "next";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { RetryError } from "@/components/states/retry-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOccupancyReport } from "@/lib/api/reports";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { todayIso } from "@/lib/date-range";
import { formatDate } from "@/lib/format";
import type { OccupancyReportRow } from "@/lib/types/reports";

export const metadata: Metadata = { title: "Ocupación de clases" };

type SearchParams = Promise<{
  startDate?: string | string[];
  endDate?: string | string[];
  classId?: string | string[];
}>;

function singleParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function validDateRange(startDate: string, endDate: string): boolean {
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  return isoDate.test(startDate) && isoDate.test(endDate) && startDate <= endDate;
}

function display(value: string | number | undefined): string {
  return value === undefined ? "—" : String(value);
}

/** Primer día del mes de `iso` (`2026-11-21` → `2026-11-01`). */
function firstDayOfMonth(iso: string): string {
  return `${iso.slice(0, 8)}01`;
}

export default async function OccupancyReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["RECEPCION_ADMIN"]);

  const params = await searchParams;
  // Por defecto: el mes en curso, para que la pantalla cargue con datos.
  const endDate = singleParam(params.endDate) || todayIso();
  const startDate = singleParam(params.startDate) || firstDayOfMonth(endDate);
  const classId = singleParam(params.classId);

  let rows: OccupancyReportRow[] = [];
  let error: string | null = null;

  if (!validDateRange(startDate, endDate)) {
    error = "Indica un rango de fechas válido: inicio antes o igual al fin.";
  } else {
    try {
      rows = await getOccupancyReport(startDate, endDate, classId);
    } catch (cause) {
      logActionError("GET /api/reports/occupancy", cause);
      error = describeApiError(
        cause,
        "No pudimos cargar el reporte de ocupación."
      );
    }
  }

  const columns: DataTableColumn<OccupancyReportRow>[] = [
    {
      key: "class",
      header: "Clase",
      cell: (row) => <span className="font-medium">{display(row.className)}</span>,
    },
    {
      key: "date",
      header: "Fecha",
      cell: (row) => (row.date ? formatDate(row.date) : "—"),
    },
    {
      key: "time",
      header: "Hora",
      cell: (row) => display(row.startTime),
    },
    {
      key: "capacity",
      header: "Cupo máximo",
      cell: (row) => display(row.maxCapacity),
    },
    {
      key: "reserved",
      header: "Reservadas",
      cell: (row) => display(row.reservedCount),
    },
    {
      key: "available",
      header: "Disponibles",
      cell: (row) => display(row.availableSpots),
    },
    {
      key: "rate",
      header: "Ocupación",
      cell: (row) => {
        const value = row.occupancyPercentage ?? row.occupancyRate;
        return value === undefined
          ? "—"
          : `${value.toLocaleString("es-GT", { maximumFractionDigits: 2 })}%`;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ocupación de clases"
        description="Ocupación por clase del mes en curso, o del rango que elijas."
      />

      <form method="get" className="bg-card flex flex-wrap items-end gap-3 rounded-xl border p-4">
        <div className="flex min-w-44 flex-col gap-1.5">
          <Label htmlFor="startDate">Fecha inicial</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={startDate} required />
        </div>
        <div className="flex min-w-44 flex-col gap-1.5">
          <Label htmlFor="endDate">Fecha final</Label>
          <Input id="endDate" name="endDate" type="date" defaultValue={endDate} required />
        </div>
        <div className="flex min-w-44 flex-col gap-1.5">
          <Label htmlFor="classId">Clase (opcional)</Label>
          <Input
            id="classId"
            name="classId"
            defaultValue={classId}
            placeholder="ID de la clase"
          />
        </div>
        <Button type="submit">Consultar</Button>
      </form>

      {error ? (
        <RetryError description={error} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sin clases en el periodo"
          description="No hay sesiones registradas en el rango seleccionado. Ajusta las fechas o elige otro mes."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) =>
            row.id ?? `${row.className ?? "clase"}-${row.date ?? "sin-fecha"}-${row.startTime ?? "sin-hora"}`
          }
        />
      )}
    </div>
  );
}
