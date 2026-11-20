import type { Metadata } from "next";
import Link from "next/link";
import { LineChart, Plus, Ruler } from "lucide-react";

import { EmptyState } from "@/components/states/empty-state";
import { RetryError } from "@/components/states/retry-error";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { ProgressChart } from "@/components/training/progress-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { describeApiError, isNotFound, logActionError } from "@/lib/actions/errors";
import { listProgressHistory } from "@/lib/api/training";
import { requireRole } from "@/lib/auth-guard";
import { formatDate } from "@/lib/format";
import type { ProgressEntry } from "@/lib/types/training";

export const metadata: Metadata = { title: "Mi progreso" };

export default async function ProgressPage() {
  await requireRole(["MIEMBRO"]);

  let entries: ProgressEntry[] = [];
  let historyUnavailable = false;
  let error: string | null = null;

  try {
    entries = await listProgressHistory();
  } catch (cause) {
    // El backend de pruebas aún no publica la consulta: `404` significa
    // «sin historial disponible», no un fallo de la pantalla.
    if (isNotFound(cause)) {
      historyUnavailable = true;
    } else {
      logActionError("GET /api/progress", cause);
      error = describeApiError(cause, "No pudimos cargar tu historial de progreso.");
    }
  }

  const header = (
    <PageHeader
      title="Mi progreso"
      description="Revisa cómo evolucionan tu peso y tus medidas a lo largo del tiempo."
      actions={
        <Button asChild size="sm">
          <Link href="/progress/new">
            <Plus />
            Registrar medidas
          </Link>
        </Button>
      }
    />
  );

  if (error) {
    return (
      <>
        {header}
        <RetryError description={error} />
      </>
    );
  }

  if (historyUnavailable || entries.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={Ruler}
          title="Aún no hay registros"
          description={
            historyUnavailable
              ? "El club todavía no expone la consulta del historial. Lo que registres ahora queda guardado: cuando la consulta esté disponible aparecerá aquí con su gráfico."
              : "Registra tu primera medición para empezar a ver tu evolución."
          }
          action={
            <Button asChild size="sm">
              <Link href="/progress/new">Registrar medidas</Link>
            </Button>
          }
        />
      </>
    );
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  const columns: DataTableColumn<ProgressEntry>[] = [
    {
      key: "date",
      header: "Fecha",
      cell: (entry) => <span className="whitespace-nowrap">{formatDate(entry.date)}</span>,
    },
    {
      key: "weight",
      header: "Peso",
      className: "text-right whitespace-nowrap",
      headerClassName: "text-right",
      cell: (entry) => `${entry.weight} kg`,
    },
    {
      key: "waist",
      header: "Cintura",
      className: "text-right whitespace-nowrap",
      headerClassName: "text-right",
      cell: (entry) => `${entry.waist} cm`,
    },
    {
      key: "chest",
      header: "Pecho",
      className: "text-right whitespace-nowrap",
      headerClassName: "text-right",
      cell: (entry) => `${entry.chest} cm`,
    },
    {
      key: "marks",
      header: "Marcas de fuerza",
      cell: (entry) =>
        entry.strengthMarks.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {entry.strengthMarks.map((mark) => (
              <span
                key={mark}
                className="bg-muted rounded px-1.5 py-0.5 text-xs"
              >
                {mark}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <>
      {header}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="size-5" aria-hidden />
            Evolución del peso
          </CardTitle>
          <CardDescription>Mediciones ordenadas de la más antigua a la más reciente.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressChart entries={entries} metric="weight" />
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={sorted}
        getRowKey={(entry) => entry.id}
        caption="Historial de mediciones"
      />
    </>
  );
}
