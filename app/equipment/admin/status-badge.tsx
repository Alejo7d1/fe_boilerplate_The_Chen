import { MACHINE_STATUS_LABELS, type MachineStatus } from "@/lib/machines/types";

const BADGE_STYLES: Record<MachineStatus, string> = {
  OPERATIVA:
    "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  EN_MANTENIMIENTO:
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  FUERA_DE_SERVICIO:
    "border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

export function StatusBadge({ status }: { status: MachineStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${BADGE_STYLES[status]}`}
    >
      {MACHINE_STATUS_LABELS[status]}
    </span>
  );
}
