export const MACHINE_STATUSES = [
  "OPERATIVA",
  "EN_MANTENIMIENTO",
  "FUERA_DE_SERVICIO",
] as const;

export type MachineStatus = (typeof MACHINE_STATUSES)[number];

export type Machine = {
  id: string;
  name: string;
  status: MachineStatus;
  reason: string | null;
  updatedAt: string;
};

export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  OPERATIVA: "Operativa",
  EN_MANTENIMIENTO: "En Mantenimiento",
  FUERA_DE_SERVICIO: "Fuera de Servicio",
};

export function isMachineStatus(value: string): value is MachineStatus {
  return (MACHINE_STATUSES as readonly string[]).includes(value);
}

// El listado siempre se muestra ordenado alfabéticamente por nombre.
export function sortMachines(machines: Machine[]): Machine[] {
  return [...machines].sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
  );
}
