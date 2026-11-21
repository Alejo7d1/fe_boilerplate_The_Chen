// lib/training-rules.ts
// Reglas de validación de H12 (ejercicios) y H13 (métricas), compartidas por
// formularios y Server Actions para que ambas capas apliquen lo mismo.

import { todayIso } from "@/lib/date-range";
import {
  EXERCISE_LIMITS,
  PROGRESS_LIMITS,
  STRENGTH_MARK_MAX,
  type RoutineExercise,
} from "@/lib/types/training";
import type { IsoDate } from "@/lib/types/common";

export type FieldErrors = Record<string, string>;

const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Convierte el texto de un input numérico en número; `NaN` si no es válido. */
export function parseMetric(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const text = (value ?? "").toString().trim().replace(",", ".");
  if (!text) return NaN;
  return Number(text);
}

function checkRange(
  value: number,
  min: number,
  max: number,
  unit: string
): string | null {
  if (!Number.isFinite(value)) return `Ingresa un número válido${unit}.`;
  if (value < min || value > max) {
    return `El valor debe estar entre ${min} y ${max}${unit}.`;
  }
  return null;
}

export interface ProgressInput {
  date: string;
  weight: string | number;
  waist: string | number;
  chest: string | number;
  strengthMarks?: string[];
}

export interface NormalizedProgress {
  date: IsoDate;
  weight: number;
  waist: number;
  chest: number;
  strengthMarks: string[];
}

/**
 * Devuelve `{ input }` cuando todo es válido o `{ fieldErrors }` con el detalle
 * por campo. La fecha no puede ser futura (BE-13.1).
 */
export function validateProgress(
  raw: ProgressInput,
  today: IsoDate = todayIso()
): { input: NormalizedProgress; fieldErrors?: never } | { fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {};

  const date = raw.date.trim();
  if (!date) fieldErrors.date = "Selecciona la fecha de la medición.";
  else if (!DATE_REGEX.test(date)) fieldErrors.date = "Fecha inválida.";
  else if (date > today) fieldErrors.date = "La fecha no puede ser futura.";

  const weight = parseMetric(raw.weight);
  const weightError = checkRange(
    weight,
    PROGRESS_LIMITS.weight.min,
    PROGRESS_LIMITS.weight.max,
    " kg"
  );
  if (weightError) fieldErrors.weight = weightError;

  const waist = parseMetric(raw.waist);
  const waistError = checkRange(
    waist,
    PROGRESS_LIMITS.waist.min,
    PROGRESS_LIMITS.waist.max,
    " cm"
  );
  if (waistError) fieldErrors.waist = waistError;

  const chest = parseMetric(raw.chest);
  const chestError = checkRange(
    chest,
    PROGRESS_LIMITS.chest.min,
    PROGRESS_LIMITS.chest.max,
    " cm"
  );
  if (chestError) fieldErrors.chest = chestError;

  const marks = (raw.strengthMarks ?? [])
    .map((mark) => mark.trim())
    .filter(Boolean);

  if (marks.some((mark) => mark.length > STRENGTH_MARK_MAX)) {
    fieldErrors.strengthMarks = `Cada marca admite hasta ${STRENGTH_MARK_MAX} caracteres.`;
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return { input: { date, weight, waist, chest, strengthMarks: marks } };
}

export interface RawExercise {
  name: string;
  series: string | number;
  reps: string | number;
}

/**
 * Valida la lista completa. El backend acepta series/reps en cero o negativos
 * y nombres vacíos, así que la única barrera es esta validación.
 */
export function validateExercises(
  raw: RawExercise[]
): { exercises: RoutineExercise[]; fieldErrors?: never } | { fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {};

  if (raw.length === 0) {
    return { fieldErrors: { exercises: "Agrega al menos un ejercicio." } };
  }
  if (raw.length > EXERCISE_LIMITS.maxPerRoutine) {
    return {
      fieldErrors: {
        exercises: `Una rutina admite hasta ${EXERCISE_LIMITS.maxPerRoutine} ejercicios.`,
      },
    };
  }

  const exercises: RoutineExercise[] = [];

  raw.forEach((item, index) => {
    const name = item.name.trim();
    if (name.length < EXERCISE_LIMITS.name.min) {
      fieldErrors[`exercises.${index}.name`] = "Escribe el nombre del ejercicio.";
    } else if (name.length > EXERCISE_LIMITS.name.max) {
      fieldErrors[`exercises.${index}.name`] =
        `El nombre admite hasta ${EXERCISE_LIMITS.name.max} caracteres.`;
    }

    const series = parseMetric(item.series);
    if (
      !Number.isInteger(series) ||
      series < EXERCISE_LIMITS.series.min ||
      series > EXERCISE_LIMITS.series.max
    ) {
      fieldErrors[`exercises.${index}.series`] =
        `Las series deben ser un entero entre ${EXERCISE_LIMITS.series.min} y ${EXERCISE_LIMITS.series.max}.`;
    }

    const reps = parseMetric(item.reps);
    if (
      !Number.isInteger(reps) ||
      reps < EXERCISE_LIMITS.reps.min ||
      reps > EXERCISE_LIMITS.reps.max
    ) {
      fieldErrors[`exercises.${index}.reps`] =
        `Las repeticiones deben ser un entero entre ${EXERCISE_LIMITS.reps.min} y ${EXERCISE_LIMITS.reps.max}.`;
    }

    exercises.push({ name, series, reps });
  });

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  return { exercises };
}
