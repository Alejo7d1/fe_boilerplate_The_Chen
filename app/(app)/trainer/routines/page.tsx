import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { RoutineBuilder } from "@/components/training/routine-builder";
import { requireRole } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Rutinas" };

export default async function TrainerRoutinesPage() {
  await requireRole(["ENTRENADOR"]);

  return (
    <>
      <PageHeader
        title="Asignación de rutinas"
        description="Elige al cliente y define los ejercicios con sus series y repeticiones."
      />
      <RoutineBuilder />
    </>
  );
}
