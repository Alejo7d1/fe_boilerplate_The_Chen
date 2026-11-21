import { CircleAlert } from "lucide-react";

/** Aviso compacto para un bloque de datos que no se pudo cargar. */
export function DataErrorNote({ message }: { message: string }) {
  return (
    <div className="border-destructive/25 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border p-2.5 text-xs">
      <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
