"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXERCISE_LIMITS } from "@/lib/types/training";

export interface ExerciseRow {
  key: string;
  name: string;
  series: string;
  reps: string;
}

export interface ExerciseEditorProps {
  rows: ExerciseRow[];
  errors?: Record<string, string>;
  onChange: (rows: ExerciseRow[]) => void;
  disabled?: boolean;
}

/** H12 · Filas dinámicas de ejercicios: nombre, series y repeticiones. */
export function ExerciseEditor({
  rows,
  errors = {},
  onChange,
  disabled,
}: ExerciseEditorProps) {
  function update(key: string, patch: Partial<ExerciseRow>) {
    onChange(rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground hidden gap-2 px-1 text-xs sm:grid sm:grid-cols-[1fr_5rem_5rem_2.5rem]">
        <span>Ejercicio</span>
        <span>Series</span>
        <span>Reps</span>
        <span className="sr-only">Quitar</span>
      </div>

      {rows.map((row, index) => (
        <div
          key={row.key}
          className="grid gap-2 sm:grid-cols-[1fr_5rem_5rem_2.5rem] sm:items-start"
        >
          <div className="flex flex-col gap-1">
            <Input
              value={row.name}
              onChange={(event) => update(row.key, { name: event.target.value })}
              placeholder={index === 0 ? "Sentadilla" : "Ejercicio"}
              maxLength={EXERCISE_LIMITS.name.max}
              aria-label={`Ejercicio ${index + 1}`}
              disabled={disabled}
            />
            {errors[`exercises.${index}.name`] ? (
              <p className="text-destructive text-xs">
                {errors[`exercises.${index}.name`]}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <Input
              value={row.series}
              onChange={(event) => update(row.key, { series: event.target.value })}
              inputMode="numeric"
              placeholder="4"
              aria-label={`Series del ejercicio ${index + 1}`}
              disabled={disabled}
            />
            {errors[`exercises.${index}.series`] ? (
              <p className="text-destructive text-xs">
                {errors[`exercises.${index}.series`]}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <Input
              value={row.reps}
              onChange={(event) => update(row.key, { reps: event.target.value })}
              inputMode="numeric"
              placeholder="12"
              aria-label={`Repeticiones del ejercicio ${index + 1}`}
              disabled={disabled}
            />
            {errors[`exercises.${index}.reps`] ? (
              <p className="text-destructive text-xs">
                {errors[`exercises.${index}.reps`]}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Quitar ejercicio ${index + 1}`}
            onClick={() => onChange(rows.filter((item) => item.key !== row.key))}
            disabled={disabled || rows.length === 1}
          >
            <Trash2 />
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([
              ...rows,
              { key: crypto.randomUUID(), name: "", series: "3", reps: "10" },
            ])
          }
          disabled={disabled || rows.length >= EXERCISE_LIMITS.maxPerRoutine}
        >
          <Plus />
          Agregar ejercicio
        </Button>
        {errors.exercises ? (
          <p className="text-destructive text-xs">{errors.exercises}</p>
        ) : null}
      </div>
    </div>
  );
}
