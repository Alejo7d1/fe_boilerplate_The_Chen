"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/client";
import { changeMachineStatus } from "@/lib/machines/service";
import { isMachineStatus, type Machine } from "@/lib/machines/types";
import { getSession } from "@/lib/session";

export type SaveMachineState = {
  outcome: "success" | "error";
  message?: string;
  machine?: Machine;
};

export async function saveMachineStatus(
  formData: FormData,
): Promise<SaveMachineState> {
  const id = String(formData.get("id") ?? "").trim();
  const rawStatus = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!id) {
    return {
      outcome: "error",
      message: "No se identificó la máquina a actualizar.",
    };
  }
  if (!isMachineStatus(rawStatus)) {
    return { outcome: "error", message: "Selecciona un estado válido." };
  }
  if (rawStatus !== "OPERATIVA" && !reason) {
    return {
      outcome: "error",
      message: "El motivo es obligatorio cuando el estado no es Operativa.",
    };
  }

  const token = await getSession();

  try {
    const machine = await changeMachineStatus(token ?? undefined, id, {
      status: rawStatus,
      // Al volver a Operativa el motivo deja de ser indisponibilidad vigente.
      reason: rawStatus === "OPERATIVA" ? null : reason,
    });

    revalidatePath("/equipment/admin");
    return { outcome: "success", machine };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return {
          outcome: "error",
          message: "Tu sesión expiró. Inicia sesión nuevamente.",
        };
      }
      return { outcome: "error", message: error.message };
    }
    console.error("Error al cambiar el estado de la máquina:", error);
    return {
      outcome: "error",
      message: "No se pudo conectar con el servidor. Intenta de nuevo.",
    };
  }
}
