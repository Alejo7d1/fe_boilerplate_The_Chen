"use client";

import { useCallback, useRef, useState } from "react";
import { MACHINE_STATUS_LABELS, type Machine } from "@/lib/machines/types";
import { MachineRow } from "./machine-row";
import { ToastAlert, type Toast } from "./toast";

type MachineAdminTableProps = {
  machines: Machine[];
  loadError: string | null;
};

export function MachineAdminTable({
  machines: initialMachines,
  loadError,
}: MachineAdminTableProps) {
  const [machines, setMachines] = useState(initialMachines);
  const [toast, setToast] = useState<Toast | null>(
    loadError ? { id: 0, kind: "error", message: loadError } : null,
  );
  const toastId = useRef(0);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleSaved = useCallback((machine: Machine) => {
    setMachines((previous) =>
      previous.map((item) => (item.id === machine.id ? machine : item)),
    );
    toastId.current += 1;
    setToast({
      id: toastId.current,
      kind: "success",
      message: `${machine.name}: estado actualizado a ${MACHINE_STATUS_LABELS[machine.status]}.`,
    });
  }, []);

  const handleError = useCallback((message: string) => {
    toastId.current += 1;
    setToast({ id: toastId.current, kind: "error", message });
  }, []);

  return (
    <>
      <ToastAlert toast={toast} onDismiss={dismissToast} />

      {machines.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No hay máquinas registradas.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {machines.map((machine) => (
            <li key={machine.id}>
              <MachineRow
                machine={machine}
                onSaved={handleSaved}
                onError={handleError}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
