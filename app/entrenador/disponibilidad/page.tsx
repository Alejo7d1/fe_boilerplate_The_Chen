import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { getSession } from "@/lib/session";
import { fetchMySlots, GYM_TIME_ZONE } from "@/lib/trainer-availability";
import { AvailabilityForm } from "./availability-form";

export const metadata: Metadata = {
  title: "Mi disponibilidad",
};

const formatDate = (iso: string) => iso.split("-").reverse().join("/");

// TODO(roles): restringir esta pantalla al rol ENTRENADOR cuando el proyecto
// tenga roles. Por ahora solo exige sesión (proxy.ts).
export default async function AvailabilityPage() {
  const token = await getSession();
  if (!token) redirect("/login");

  const { status, slots } = await fetchMySlots(token).catch(() => ({
    status: 0,
    slots: [],
  }));

  // Fecha de hoy en la zona horaria del gimnasio, para el `min` del selector.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: GYM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Mi disponibilidad</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Cada bloque dura 60 minutos. Los miembros podrán agendar sesiones
        contigo en los bloques que registres.
      </p>

      <section className="mb-8 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="mb-4 font-medium">Nuevo bloque</h2>
        <AvailabilityForm minDate={today} />
      </section>

      <section>
        <h2 className="mb-4 font-medium">Bloques registrados</h2>

        {status === 401 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm">
              Tu sesión expiró. Inicia sesión de nuevo para ver tus bloques.
            </p>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
              >
                Volver a iniciar sesión
              </button>
            </form>
          </div>
        ) : status !== 200 ? (
          <p className="text-sm text-red-600">
            No se pudieron cargar tus bloques. Intenta más tarde.
          </p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Aún no has registrado bloques.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-2 pr-4 font-medium">Fecha</th>
                  <th className="py-2 pr-4 font-medium">Inicio</th>
                  <th className="py-2 pr-4 font-medium">Fin</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr
                    key={slot.slotId}
                    className="border-b border-zinc-100 dark:border-zinc-900"
                  >
                    <td className="py-2 pr-4">{formatDate(slot.date)}</td>
                    <td className="py-2 pr-4">{slot.startTime}</td>
                    <td className="py-2 pr-4">{slot.endTime}</td>
                    <td className="py-2">
                      {slot.isBooked ? "Reservado" : "Disponible"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}