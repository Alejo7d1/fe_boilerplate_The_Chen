import { cn } from "@/lib/utils";

export interface CapacityBarProps {
  occupied: number;
  capacity: number;
  className?: string;
}

/** Barra de ocupación derivada de cupos ocupados / cupo máximo. */
export function CapacityBar({ occupied, capacity, className }: CapacityBarProps) {
  const percent =
    capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-valuenow={occupied}
      aria-label="Ocupación"
      className={cn("bg-muted h-1.5 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300",
          percent >= 100
            ? "bg-destructive"
            : percent >= 75
              ? "bg-warning"
              : "bg-primary"
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
