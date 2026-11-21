// components/training/progress-chart.tsx
// Gráfico de líneas en SVG propio: el proyecto no tiene librería de gráficos.
// Server Component puro (sin estado ni efectos).

import { formatDate } from "@/lib/format";
import type { ProgressEntry } from "@/lib/types/training";

const WIDTH = 560;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 44 };

export interface ProgressChartProps {
  entries: ProgressEntry[];
  /** Propiedad a graficar. */
  metric?: "weight" | "waist" | "chest";
}

const METRIC_LABEL: Record<NonNullable<ProgressChartProps["metric"]>, string> = {
  weight: "Peso (kg)",
  waist: "Cintura (cm)",
  chest: "Pecho (cm)",
};

/**
 * Requiere al menos dos mediciones para trazar una línea. Ordena por fecha de
 * forma ascendente y escala el eje Y con un 5 % de margen.
 */
export function ProgressChart({ entries, metric = "weight" }: ProgressChartProps) {
  const points = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({ date: entry.date, value: entry[metric] }));

  if (points.length < 2) return null;

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const lower = min - spread * 0.05;
  const upper = max + spread * 0.05;

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (index: number) =>
    PADDING.left + (plotWidth * index) / (points.length - 1);
  const y = (value: number) =>
    PADDING.top + plotHeight - ((value - lower) / (upper - lower)) * plotHeight;

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.value)}`)
    .join(" ");

  const ticks = [max, (max + min) / 2, min];

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Evolución de ${METRIC_LABEL[metric].toLowerCase()} en ${points.length} mediciones`}
        className="text-primary h-auto w-full"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y(tick)}
              y2={y(tick)}
              className="stroke-border"
              strokeDasharray="4 4"
            />
            <text
              x={PADDING.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-muted-foreground text-[10px]"
            >
              {Math.round(tick * 10) / 10}
            </text>
          </g>
        ))}

        <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />

        {points.map((point, index) => (
          <circle
            key={`${point.date}-${index}`}
            cx={x(index)}
            cy={y(point.value)}
            r={3}
            fill="currentColor"
          />
        ))}

        <text
          x={PADDING.left}
          y={HEIGHT - 8}
          className="fill-muted-foreground text-[10px]"
        >
          {formatDate(points[0].date)}
        </text>
        <text
          x={WIDTH - PADDING.right}
          y={HEIGHT - 8}
          textAnchor="end"
          className="fill-muted-foreground text-[10px]"
        >
          {formatDate(points[points.length - 1].date)}
        </text>
      </svg>
      <figcaption className="text-muted-foreground text-xs">
        {METRIC_LABEL[metric]} · {points.length} mediciones
      </figcaption>
    </figure>
  );
}
