// lib/types/training.ts
// H12 · Asignación de rutinas (ENTRENADOR).
// H13 · Registro y consulta de progreso físico (MIEMBRO).
// Contrato tomado de BE-12.1 / BE-13.1; ver docs/api-contracts-ep6-training.md.

import type { EntityId, IsoDate } from "@/lib/types/common";

/** Ejercicio de una rutina. */
export interface RoutineExercise {
  name: string;
  series: number;
  reps: number;
}

/** `POST /api/routines` */
export interface AssignRoutineRequest {
  memberId: EntityId;
  exercises: RoutineExercise[];
}

/** Respuesta del alta de rutina: `{ routineId, memberId, updatedAt }`. */
export interface Routine {
  id: EntityId;
  memberId: EntityId;
  updatedAt?: string;
}

/** `POST /api/progress` */
export interface RecordProgressRequest {
  date: IsoDate;
  weight: number;
  waist: number;
  chest: number;
  /** Marcas de fuerza libres («Press banca 80 kg»). Opcional. */
  strengthMarks?: string[];
}

/**
 * Medición registrada. El alta del backend solo confirma `progressId`,
 * `memberId` y `date`; las métricas se completan con lo que el miembro envió
 * (nunca con valores supuestos).
 */
export interface ProgressEntry {
  id: EntityId;
  memberId?: EntityId;
  date: IsoDate;
  weight: number;
  waist: number;
  chest: number;
  strengthMarks: string[];
}

/** Límites del contrato para las métricas (BE-13.1). */
export const PROGRESS_LIMITS = {
  weight: { min: 20, max: 500 },
  waist: { min: 30, max: 300 },
  chest: { min: 30, max: 300 },
} as const;

/** Límites de UI para los ejercicios: el backend no los valida. */
export const EXERCISE_LIMITS = {
  name: { min: 2, max: 100 },
  series: { min: 1, max: 20 },
  reps: { min: 1, max: 100 },
  maxPerRoutine: 30,
} as const;

/** Marca de fuerza: texto libre acotado. */
export const STRENGTH_MARK_MAX = 80;
