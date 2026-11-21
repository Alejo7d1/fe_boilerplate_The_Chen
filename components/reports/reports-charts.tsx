// components/reports/reports-charts.tsx
// Gráficos del reporte de ingresos. Son CSS puro: no agregan dependencias y
// funcionan igual en el servidor (sin estado ni efectos).

import { cn } from "@/lib/utils";

const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export interface ChartDatum {
  label: string;
  value: number;
  hint?: string;
}

export interface ChartSegment {
  label: string;
  value: number;
  color: string;
}

function seriesColor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length];
}

function ratio(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(2, Math.min(100, (value / max) * 100));
}

/** Barras horizontales con etiqueta y valor: sirve para rankings y montos. */
export function BarList({
  data,
  formatValue,
  className,
}: {
  data: ChartDatum[];
  formatValue: (value: number) => string;
  className?: string;
}) {
  const max = Math.max(0, ...data.map((item) => item.value));

  return (
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {data.map((item, index) => (
        <li key={item.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-medium">{item.label}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {formatValue(item.value)}
              {item.hint ? (
                <span className="ml-1 opacity-70">· {item.hint}</span>
              ) : null}
            </span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full"
              style={{
                width: `${ratio(item.value, max)}%`,
                backgroundColor: seriesColor(index),
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Columnas verticales con el valor encima. */
export function ColumnChart({
  data,
  formatValue,
  className,
}: {
  data: ChartDatum[];
  formatValue: (value: number) => string;
  className?: string;
}) {
  const max = Math.max(0, ...data.map((item) => item.value));
  const description = data
    .map((item) => `${item.label}: ${formatValue(item.value)}`)
    .join("; ");

  return (
    <div
      role="img"
      aria-label={description || "Sin datos para graficar"}
      className={cn("flex items-end gap-2 sm:gap-3", className)}
    >
      {data.map((item, index) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
        >
          <span className="text-[0.65rem] font-medium tabular-nums">
            {formatValue(item.value)}
          </span>
          <div className="bg-muted/60 flex h-28 w-full items-end rounded-md">
            <div
              className="w-full rounded-md transition-[height] duration-300"
              style={{
                height: `${ratio(item.value, max)}%`,
                backgroundColor: seriesColor(index),
              }}
            />
          </div>
          <span className="text-muted-foreground text-center text-[0.62rem] leading-tight text-balance">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Dona con `conic-gradient` y leyenda con porcentajes. */
export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  formatValue,
  className,
}: {
  segments: ChartSegment[];
  centerValue: string;
  centerLabel: string;
  formatValue: (value: number) => string;
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const visible = segments.filter((segment) => segment.value > 0);
  let accumulated = 0;
  const stops = visible.map((segment) => {
    const start = (accumulated / total) * 100;
    accumulated += segment.value;
    const end = (accumulated / total) * 100;
    return `${segment.color} ${start}% ${end}%`;
  });

  return (
    <div className={cn("flex flex-wrap items-center gap-5", className)}>
      <div
        role="img"
        aria-label={segments
          .map((segment) => `${segment.label}: ${formatValue(segment.value)}`)
          .join("; ")}
        className="relative size-28 shrink-0 rounded-full"
        style={{
          background:
            total > 0 ? `conic-gradient(${stops.join(", ")})` : "var(--muted)",
        }}
      >
        <div className="bg-card absolute inset-3 flex flex-col items-center justify-center rounded-full text-center">
          <span className="font-heading text-sm leading-tight font-semibold tabular-nums">
            {centerValue}
          </span>
          <span className="text-muted-foreground text-[0.55rem] leading-tight tracking-wide uppercase">
            {centerLabel}
          </span>
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: segment.color }}
            />
            <span className="flex-1 truncate">{segment.label}</span>
            <span className="shrink-0 tabular-nums">
              {formatValue(segment.value)}
            </span>
            <span className="text-muted-foreground w-10 shrink-0 text-right tabular-nums">
              {total > 0 ? `${Math.round((segment.value / total) * 100)}%` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barra apilada con leyenda: composición de una misma cifra. */
export function StackedBar({
  segments,
  formatValue,
  className,
}: {
  segments: ChartSegment[];
  formatValue: (value: number) => string;
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="bg-muted flex h-3 w-full overflow-hidden rounded-full">
        {total > 0
          ? segments
              .filter((segment) => segment.value > 0)
              .map((segment) => (
                <span
                  key={segment.label}
                  className="h-full"
                  style={{
                    width: `${(segment.value / total) * 100}%`,
                    backgroundColor: segment.color,
                  }}
                />
              ))
          : null}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-medium tabular-nums">
              {formatValue(segment.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Medidor 0–100 con etiqueta opcional. */
export function Meter({
  value,
  caption,
  className,
}: {
  value: number;
  caption?: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        role="meter"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={caption ?? "Indicador"}
        className="bg-muted h-2.5 w-full overflow-hidden rounded-full"
      >
        <div
          className="from-primary to-info h-full rounded-full bg-linear-to-r"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {caption ? (
        <span className="text-muted-foreground text-[0.68rem]">{caption}</span>
      ) : null}
    </div>
  );
}

export const CHART_COLORS = {
  revenue: "var(--chart-1)",
  pending: "var(--chart-4)",
  neutral: "var(--chart-5)",
  accent: "var(--chart-2)",
  info: "var(--chart-3)",
} as const;
