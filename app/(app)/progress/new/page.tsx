import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { ProgressForm } from "@/components/training/progress-form";
import { requireRole } from "@/lib/auth-guard";
import { todayIso } from "@/lib/date-range";

export const metadata: Metadata = { title: "Registrar medidas" };

export default async function NewProgressPage() {
  await requireRole(["MIEMBRO"]);

  // La fecha de hoy se calcula en el servidor para no depender del reloj del
  // navegador al validar «no futura».
  return (
    <>
      <PageHeader
        title="Registrar medidas"
        description="Anota tu peso, cintura y pecho; opcionalmente agrega tus marcas de fuerza."
      />
      <ProgressForm today={todayIso()} />
    </>
  );
}
