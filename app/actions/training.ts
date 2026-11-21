"use server";

import { revalidatePath } from "next/cache";

import { describeApiError, errorCode, logActionError } from "@/lib/actions/errors";
import type { ActionErrorCode } from "@/lib/actions/form-state";
import { searchMembers } from "@/lib/api/members";
import { assignRoutine, recordProgress } from "@/lib/api/training";
import { hasAnyRole } from "@/lib/auth-guard";
import { validateExercises, validateProgress, type RawExercise } from "@/lib/training-rules";
import type { MemberSummary } from "@/lib/types/members";
import type { ProgressEntry, Routine } from "@/lib/types/training";

const ROUTINE_FORBIDDEN = "Solo los entrenadores pueden asignar rutinas.";
const PROGRESS_FORBIDDEN = "Solo los miembros pueden registrar su progreso.";

/** H12 · Resultado de la búsqueda de clientes del entrenador. */
export type RoutineMemberSearchResult =
  | { ok: true; members: MemberSummary[] }
  | { ok: false; message: string; code?: ActionErrorCode };

/**
 * H12 · Busca miembros para el selector.
 * `GET /api/users?role=MIEMBRO` exige `RECEPCION_ADMIN`, así que el entrenador
 * recibe `403`: la pantalla lo informa y ofrece capturar el identificador.
 */
export async function searchRoutineMembersAction(
  query: string
): Promise<RoutineMemberSearchResult> {
  if (!(await hasAnyRole(["ENTRENADOR"]))) {
    return { ok: false, message: ROUTINE_FORBIDDEN, code: "forbidden" };
  }

  try {
    return { ok: true, members: await searchMembers(query) };
  } catch (cause) {
    logActionError("training.searchMembers", cause);
    return {
      ok: false,
      message: describeApiError(
        cause,
        "La búsqueda de clientes no está disponible. Ingresa el identificador del miembro."
      ),
      code: errorCode(cause),
    };
  }
}

export interface AssignRoutineActionResult {
  ok: boolean;
  message?: string;
  routine?: Routine;
  fieldErrors?: Record<string, string>;
  code?: ActionErrorCode;
}

export interface AssignRoutineInput {
  memberId: string;
  exercises: RawExercise[];
}

/** H12 · `POST /api/routines` con al menos un ejercicio. */
export async function assignRoutineAction(
  input: AssignRoutineInput
): Promise<AssignRoutineActionResult> {
  if (!(await hasAnyRole(["ENTRENADOR"]))) {
    return { ok: false, message: ROUTINE_FORBIDDEN, code: "forbidden" };
  }

  const memberId = input.memberId.trim();
  if (!memberId) {
    return {
      ok: false,
      message: "Selecciona al miembro.",
      fieldErrors: { memberId: "Selecciona o ingresa el miembro." },
    };
  }

  const parsed = validateExercises(input.exercises);
  if (parsed.fieldErrors) {
    return {
      ok: false,
      message: "Revisa los ejercicios de la rutina.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  try {
    const routine = await assignRoutine({ memberId, exercises: parsed.exercises });
    revalidatePath("/trainer/routines");
    return { ok: true, routine, message: "Rutina asignada." };
  } catch (cause) {
    logActionError("training.assignRoutine", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos asignar la rutina."),
      code: errorCode(cause),
    };
  }
}

export interface RecordProgressResult {
  ok: boolean;
  message?: string;
  entry?: ProgressEntry;
  fieldErrors?: Record<string, string>;
  code?: ActionErrorCode;
}

/** H13 · `POST /api/progress` con métricas validadas y fecha no futura. */
export async function recordProgressAction(
  input: Parameters<typeof validateProgress>[0]
): Promise<RecordProgressResult> {
  if (!(await hasAnyRole(["MIEMBRO"]))) {
    return { ok: false, message: PROGRESS_FORBIDDEN, code: "forbidden" };
  }

  const parsed = validateProgress(input);
  if (parsed.fieldErrors) {
    return {
      ok: false,
      message: "Revisa las medidas registradas.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  try {
    const entry = await recordProgress(parsed.input);
    revalidatePath("/progress");
    return { ok: true, entry, message: "Medición registrada." };
  } catch (cause) {
    logActionError("training.recordProgress", cause);
    return {
      ok: false,
      message: describeApiError(cause, "No pudimos registrar tus medidas."),
      code: errorCode(cause),
    };
  }
}
