"use client";

import { useActionState } from "react";
import {
  createAvailability,
  type AvailabilityState,
} from "@/app/actions/trainer-availability";

const initialState: AvailabilityState = {};

// Horas de inicio de 06:00 a 21:00.
const HOURS = Array.from(
  { length: 16 },
  (_, i) => `${String(i + 6).padStart(2, "0")}:00`,
);

const fieldClass =
  "rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100";

export function AvailabilityForm({ minDate }: { minDate: string }) {
  const [state, formAction, pending] = useActionState(
    createAvailability,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="date" className="text-sm font-medium">
            Fecha
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            min={minDate}
            defaultValue={state.date}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="startTime" className="text-sm font-medium">
            Hora de inicio
          </label>
          <select
            id="startTime"
            name="startTime"
            required
            defaultValue={state.startTime ?? ""}
            className={fieldClass}
          >
            <option value="" disabled>
              Selecciona
            </option>
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition-opacity disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Agregar bloque"}
        </button>
      </div>

      <p
        aria-live="polite"
        className={`min-h-5 text-sm ${state.error ? "text-red-600" : "text-green-600"}`}
      >
        {state.error ?? state.success}
      </p>
    </form>
  );
}