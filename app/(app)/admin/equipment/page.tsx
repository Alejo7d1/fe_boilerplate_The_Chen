import type { Metadata } from "next";

import { listEquipment } from "@/lib/api/equipment";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { EquipmentAdminTable } from "@/components/equipment/equipment-admin-table";
import { PageHeader } from "@/components/page-header";
import { RetryError } from "@/components/states/retry-error";
import type { Equipment } from "@/lib/types/equipment";

export const metadata: Metadata = { title: "Máquinas" };

export default async function AdminEquipmentPage() {
  await requireRole(["RECEPCION_ADMIN"]);

  let equipment: Equipment[] = [];
  let error: string | null = null;

  try {
    equipment = await listEquipment();
  } catch (cause) {
    logActionError("GET /api/equipment", cause);
    error = describeApiError(cause, "No pudimos cargar las máquinas.");
  }

  return (
    <>
      <PageHeader
        title="Máquinas"
        description="Consulta el inventario y actualiza el estado de cada máquina con su motivo."
      />
      {error ? <RetryError description={error} /> : <EquipmentAdminTable equipment={equipment} />}
    </>
  );
}
