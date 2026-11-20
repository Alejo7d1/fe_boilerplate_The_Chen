import type { Metadata } from "next";

import { listEquipment } from "@/lib/api/equipment";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { EquipmentGrid } from "@/components/equipment/equipment-grid";
import { PageHeader } from "@/components/page-header";
import type { Equipment } from "@/lib/types/equipment";

export const metadata: Metadata = { title: "Equipos" };

export default async function EquipmentPage() {
  await requireRole(["MIEMBRO", "ENTRENADOR", "RECEPCION_ADMIN"]);

  let equipment: Equipment[] = [];
  let error: string | null = null;

  try {
    equipment = await listEquipment();
  } catch (cause) {
    logActionError("GET /api/equipment", cause);
    error = describeApiError(cause, "No pudimos cargar la disponibilidad del equipo.");
  }

  return (
    <>
      <PageHeader
        title="Disponibilidad del equipo"
        description="Consulta el estado de las máquinas antes o durante tu visita."
      />
      <EquipmentGrid initialEquipment={equipment} initialError={error} />
    </>
  );
}
