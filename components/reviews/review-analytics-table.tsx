import { ChartBar } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StarRating } from "@/components/reviews/star-rating";
import { EmptyState } from "@/components/states/empty-state";
import { reviewTargetLabel } from "@/lib/review-rules";
import { REVIEW_RATING_MAX, type ReviewAverage } from "@/lib/types/reviews";

export interface ReviewAnalyticsTableProps {
  averages: ReviewAverage[];
}

/** H17 · Promedios por entrenador y por clase tal como los devuelve el backend. */
export function ReviewAnalyticsTable({ averages }: ReviewAnalyticsTableProps) {
  if (averages.length === 0) {
    return (
      <EmptyState
        icon={ChartBar}
        title="Aún no hay promedios"
        description="Cuando los miembros califiquen sus clases, aquí aparecerán los promedios por entrenador y por clase del rango elegido."
      />
    );
  }

  const columns: DataTableColumn<ReviewAverage>[] = [
    {
      key: "target",
      header: "Objetivo",
      cell: (row) => <span className="font-medium">{row.targetName}</span>,
    },
    {
      key: "type",
      header: "Tipo",
      cell: (row) => reviewTargetLabel(row.targetType),
    },
    {
      key: "average",
      header: "Promedio",
      cell: (row) =>
        row.average === null ? (
          <span className="text-muted-foreground">Sin calificaciones</span>
        ) : (
          <span className="flex items-center gap-2">
            <StarRating value={Math.round(row.average)} size="sm" />
            <span className="whitespace-nowrap tabular-nums">
              {row.average.toFixed(1)} / {REVIEW_RATING_MAX}
            </span>
          </span>
        ),
    },
    {
      key: "total",
      header: "Reseñas",
      className: "text-right whitespace-nowrap tabular-nums",
      headerClassName: "text-right",
      cell: (row) =>
        row.totalReviews === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          row.totalReviews
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={averages}
      getRowKey={(row) => `${row.targetType}-${row.targetId}`}
      caption="Promedios de reseñas"
    />
  );
}
