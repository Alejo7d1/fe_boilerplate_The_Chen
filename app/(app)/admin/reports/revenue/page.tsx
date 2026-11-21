import type { Metadata } from "next";

import { EmptyState } from "@/components/states/empty-state";
import { RetryError } from "@/components/states/retry-error";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFinancialReport } from "@/lib/api/reports";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { formatCurrency } from "@/lib/format";
import type { FinancialReport } from "@/lib/types/reports";

export const metadata: Metadata = { title: "Ingresos y renovación" };

type SearchParams = Promise<{
  startDate?: string | string[];
  endDate?: string | string[];
}>;

function singleParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function validDateRange(startDate: string, endDate: string): boolean {
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  return isoDate.test(startDate) && isoDate.test(endDate) && startDate <= endDate;
}

export default async function RevenueReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["RECEPCION_ADMIN"]);

  const params = await searchParams;
  const startDate = singleParam(params.startDate);
  const endDate = singleParam(params.endDate);
  const canFetch = Boolean(startDate && endDate);

  let report: FinancialReport | null = null;
  let error: string | null = null;

  if (canFetch) {
    if (!validDateRange(startDate, endDate)) {
      error = "Indica un rango de fechas válido: inicio antes o igual al fin.";
    } else {
      try {
        report = await getFinancialReport(startDate, endDate);
      } catch (cause) {
        logActionError("GET /api/reports/financial", cause);
        error = describeApiError(
          cause,
          "No pudimos cargar el reporte financiero."
        );
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ingresos y renovación"
        description="Consulta los ingresos y la renovación de membresías en un rango de fechas."
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
        <Button type="submit">Consultar</Button>
      </form>

      {error ? (
        <RetryError description={error} />
      ) : !report ? (
        <EmptyState
          title="Selecciona un periodo"
          description="Ingresa las fechas inicial y final para consultar el reporte financiero."
        />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Ingresos"
            value={
              report.totalRevenue === undefined
                ? "No informado"
                : formatCurrency(report.totalRevenue)
            }
          />
          <MetricCard
            title="Pagos"
            value={
              report.paymentCount === undefined
                ? "No informado"
                : report.paymentCount.toLocaleString("es-GT")
            }
          />
          <MetricCard
            title="Renovaciones"
            value={
              report.renewals === undefined
                ? "No informado"
                : report.renewals.toLocaleString("es-GT")
            }
          />
          <MetricCard
            title="Tasa de renovación"
            value={
              report.renewalRate === undefined
                ? "No informado"
                : `${report.renewalRate.toLocaleString("es-GT", {
                    maximumFractionDigits: 2,
                  })}%`
            }
          />
        </section>
      )}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
