// lib/actions/form-state.ts
// Estado compartido por las Server Actions usadas con `useActionState` y
// resultado de las acciones invocadas desde transiciones.

export interface FormState {
  /** Mensaje general (validación, 400/403/404/409, fallo de contrato). */
  error?: string;
  /** Errores por campo del formulario. */
  fieldErrors?: Record<string, string>;
  /** `true` cuando la mutación se completó; el formulario cierra y muestra un toast. */
  success?: boolean;
}

export const IDLE_FORM_STATE: FormState = {};

export type ActionErrorCode = "forbidden" | "conflict" | "not-found";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; code?: ActionErrorCode };
