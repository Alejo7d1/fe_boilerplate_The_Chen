"use client";

import { useState, useTransition } from "react";
import { saveMachineStatus } from "@/app/actions/machines";
import {
  MACHINE_STATUSES,
  MACHINE_STATUS_LABELS,
  type Machine,
  type MachineStatus,
} from "@/lib/machines/types";
import { StatusBadge } from "./status-badge";

type MachineRowProps = {
  machine: Machine;
  onSaved: (machine: Machine) => void;
  onError: (message: string) => void;
};

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function MachineRow({ machine, onSaved, onError }: MachineRowProps) {
  const [status, setStatus] = useState<MachineStatus>(machine.status);
  const [reason, setReason] = useState(machine.reason ?? "");
  const [pending, startTransition] = useTransition();

  const statusChanged = status !== machine.status;
  const reasonRequired = status !== "OPERATIVA";
  const reasonValid = !reasonRequired || reason.trim().length > 0;
  const canSave = statusChanged && reasonValid && !pending;

  function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.target.value as MachineStatus;
    setStatus(nextStatus);
    if (nextStatus === "OPERATIVA") {
      setReason("");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveMachineStatus(formData);

      if (result.outcome === "success" && result.machine) {
        onSaved(result.machine);
        setStatus(result.machine.status);
        setReason(result.machine.reason ?? "");
        return;
      }

      onError(result.message ?? "No se pudo guardar el cambio.");
      // Revierte la selección al último estado confirmado por el servidor.
      setStatus(machine.status);
      setReason(machine.reason ?? "");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 md:p-5"
    >
      <input type="hidden" name="id" value={machine.id} />
      <input type="hidden" name="status" value={status} />

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{machine.name}</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Última actualización:{" "}
            <time dateTime={machine.updatedAt} suppressHydrationWarning>
              {formatUpdatedAt(machine.updatedAt)}
            </time>
          </p>
        </div>
        <StatusBadge status={machine.status} />
      </div>

      <p className="mt-3 text-sm">
        <span className="font-medium">Motivo vigente: </span>
        <span className="text-zinc-700 dark:text-zinc-300">
          {machine.reason ?? "Sin motivo registrado"}
        </span>
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`status-${machine.id}`}
            className="text-sm font-medium"
          >
            Estado
          </label>
          <select
            id={`status-${machine.id}`}
            value={status}
            onChange={handleStatusChange}
            disabled={pending}
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:focus:border-zinc-100"
          >
            {MACHINE_STATUSES.map((option) => (
              <option key={option} value={option}>
                {MACHINE_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`reason-${machine.id}`}
            className="text-sm font-medium"
          >
            Motivo
          </label>
          <textarea
            id={`reason-${machine.id}`}
            name="reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={!reasonRequired || pending}
            aria-required={reasonRequired}
            placeholder={
              reasonRequired
                ? "Describe el motivo del estado seleccionado"
                : "No aplica para máquinas operativas"
            }
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:focus:border-zinc-100"
          />
          <div className="flex justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              {reasonRequired
                ? "Obligatorio cuando el estado no es Operativa."
                : "Solo aplica a estados no operativos."}
            </span>
            <span aria-live="polite">{reason.length} caracteres</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={!canSave}
          className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <>
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </button>
      </div>
    </form>
  );
}
