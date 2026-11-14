import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = "Cargando…",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "text-muted-foreground flex flex-col items-center justify-center gap-2 py-10",
        className
      )}
    >
      <Spinner aria-label={label} className="size-5" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
