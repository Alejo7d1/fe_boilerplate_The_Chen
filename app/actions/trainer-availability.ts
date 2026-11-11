"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteSession, getSession } from "@/lib/session";
import { postSlot } from "@/lib/trainer-availability";

export type AvailabilityState = {
  error?: string;
  success?: string;
  date?: string;
  startTime?: string;
};

export async function createAvailability(
  _prevState: AvailabilityState,
  formData: FormData,
): Promise<AvailabilityState> {
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");

  if (!date || !startTime) {
    return { error: "Selecciona una fecha y una hora de inicio.", date, startTime };
  }

  const token = await getSession();
  if (!token) redirect("/login");

  const result = await postSlot(token, { date, startTime }).catch((error) => {
    console.error("Error al registrar disponibilidad:", error);
    return null;
  });

  if (!result) {
    return { error: "No se pudo conectar con el servidor. Intenta más tarde.", date, startTime };
  }

  // El access token del backend expira (15 min por defecto) y el boilerplate
  // aún no usa refresh token: se cierra la sesión y se pide login de nuevo.
  if (result.status === 401) {
    await deleteSession();
    redirect("/login");
  }

  if (result.status === 201) {
    revalidatePath("/entrenador/disponibilidad");
    return { success: "Bloque registrado correctamente." };
  }

  if (result.status === 400) {
    return {
      error: result.message ?? "No se pueden registrar fechas pasadas.",
      date,
      startTime,
    };
  }
  if (result.status === 409) {
    return { error: "Ya tienes un bloque registrado en ese horario.", date, startTime };
  }
  if (result.status === 403) {
    return { error: "No tienes permiso para registrar disponibilidad.", date, startTime };
  }

  return { error: "No se pudo registrar el bloque. Intenta más tarde.", date, startTime };
}