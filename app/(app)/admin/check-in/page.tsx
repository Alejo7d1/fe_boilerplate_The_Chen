import type { Metadata } from "next";

import { requireRole } from "@/lib/auth-guard";
import { CheckInPanel } from "@/components/access/check-in-panel";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Check-in" };

export default async function CheckInPage() {
  await requireRole(["RECEPCION_ADMIN"]);

  return (
    <>
      <PageHeader
        title="Registro de ingreso"
        description="Busca al miembro por carné o nombre y valida la vigencia de su membresía."
      />
      <CheckInPanel />
    </>
  );
}
