import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RevenueDashboard } from "@/components/reports/revenue-dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchMembers } from "@/lib/api/members";
import { listAllPendingCharges } from "@/lib/api/payments";
import { listPlans } from "@/lib/api/plans";
import { getFinancialReport, getOccupancyReport } from "@/lib/api/reports";
import { requireRole } from "@/lib/auth-guard";
import { addDays, todayIso } from "@/lib/date-range";
import { readSettled } from "@/lib/dashboard";
import { formatDate } from "@/lib/format";
import type { IsoDate } from "@/lib/types/common";

export const metadata: Metadata = { title: "Ingresos y renovación" };

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_WINDOW_DAYS = 30;

const PRESETS = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
] as const;

type SearchParams = Promise<{
  startDate?: string | string[];
  endDate?: string | string[];
}>;

function readDate(value: string | string[] | undefined): IsoDate | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && DATE_REGEX.test(trimmed) ? trimmed : undefined;
}

export default async function RevenueReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["RECEPCION_ADMIN"]);

  const params = await searchParams;
  const today = todayIso();
  const endDate = readDate(params.endDate) ?? today;
  const startDate =
    readDate(params.startDate) ?? addDays(endDate, -(DEFAULT_WINDOW_DAYS - 1));
  const invalidRange = startDate > endDate;

  const settled = invalidRange
    ? null
    : await Promise.allSettled([
        getFinancialReport(startDate, endDate),
        listAllPendingCharges(),
        listPlans(),
        getOccupancyReport(startDate, endDate),
        searchMembers(""),
      ]);

  const rangeError = "Rango de fechas inválido.";
  const financial = settled
    ? readSettled(
        settled[0],
        "GET /api/reports/financial",
        "No pudimos cargar los ingresos del periodo."
      )
    : { data: null, error: rangeError };
  const pending = settled
    ? readSettled(
        settled[1],
        "GET /api/charges/pending",
        "No pudimos cargar los cobros pendientes."
      )
    : { data: null, error: rangeError };
  const plans = settled
    ? readSettled(settled[2], "GET /api/plans", "No pudimos cargar los planes.")
    : { data: null, error: rangeError };
  const activity = settled
    ? readSettled(
        settled[3],
        "GET /api/reports/occupancy",
        "No pudimos cargar la actividad de clases."
      )
    : { data: null, error: rangeError };
  const members = settled
    ? readSettled(
        settled[4],
        "GET /api/users (miembros)",
        "No pudimos cargar el padrón de miembros."
      )
    : { data: null, error: rangeError };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ingresos y renovación"
        description="Ingresos cobrados, cartera pendiente, renovaciones y actividad del club en un rango de fechas."
      />

      <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-44 flex-col gap-1.5">
            <Label htmlFor="startDate">Fecha inicial</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={startDate}
              required
            />
          </div>
          <div className="flex min-w-44 flex-col gap-1.5">
            <Label htmlFor="endDate">Fecha final</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={endDate}
              required
            />
          </div>
          <Button type="submit">Consultar</Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="text-muted-foreground text-xs">
            {formatDate(startDate)} — {formatDate(endDate)}
          </span>
          <span className="text-muted-foreground/60 text-xs">·</span>
          <span className="text-muted-foreground text-xs">Atajos:</span>
          {PRESETS.map((preset) => {
            const presetStart = addDays(today, -(preset.days - 1));
            const href = `/admin/reports/revenue?startDate=${presetStart}&endDate=${today}`;
            const active = startDate === presetStart && endDate === today;
            return (
              <Button
                key={preset.label}
                asChild
                size="sm"
                variant={active ? "secondary" : "ghost"}
              >
                <Link href={href}>{preset.label}</Link>
              </Button>
            );
          })}
          <Button asChild size="sm" variant="ghost" className="ml-auto">
            <Link href="/admin/pending-charges">Ver cobros pendientes</Link>
          </Button>
        </div>
      </div>

      {invalidRange ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Rango de fechas inválido</AlertTitle>
          <AlertDescription>
            La fecha inicial no puede ser posterior a la final.
          </AlertDescription>
        </Alert>
      ) : (
        <RevenueDashboard
          financial={financial}
          pending={pending}
          plans={plans}
          activity={activity}
          members={members}
          today={today}
        />
      )}
    </div>
  );
}
