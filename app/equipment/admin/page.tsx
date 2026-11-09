import type { Metadata } from "next";
import Link from "next/link";
import { ApiError } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listMachines } from "@/lib/machines/service";
import { sortMachines, type Machine } from "@/lib/machines/types";
import { getSession } from "@/lib/session";
import { MachineAdminTable } from "./machine-admin-table";

export const metadata: Metadata = {
  title: "Administración de máquinas",
};

export default async function EquipmentAdminPage() {
  const user = await getCurrentUser();

  // Si el token expone el rol y no es administrador, se evita la vista.
  if (user?.role && user.role !== "ADMINISTRADOR") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Acceso restringido</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Solo los administradores pueden administrar el estado de las
          máquinas.
        </p>
        <Link
          href="/"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          Volver al inicio
        </Link>
      </main>
    );
  }

  const token = await getSession();
  let machines: Machine[] = [];
  let loadError: string | null = null;

  try {
    machines = sortMachines(await listMachines(token ?? undefined));
  } catch (error) {
    if (error instanceof ApiError) {
      loadError =
        error.status === 401
          ? "Tu sesión expiró. Inicia sesión nuevamente."
          : error.message;
    } else {
      console.error("Error al cargar el inventario de máquinas:", error);
      loadError = "No se pudo cargar el inventario de máquinas.";
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Administración de máquinas</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Cambia el estado de cada máquina y registra el motivo cuando deje de
            estar operativa.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          Volver al inicio
        </Link>
      </header>

      <MachineAdminTable machines={machines} loadError={loadError} />
    </main>
  );
}
