import type { Metadata } from "next";
import { Receipt } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PaymentForm } from "@/components/payments/payment-form";
import { EmptyState } from "@/components/states/empty-state";
import { requireRole } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Pago" };

export default async function ProcessPaymentPage(props: {
  searchParams: Promise<{ chargeId?: string | string[] }>;
}) {
  await requireRole(["MIEMBRO"]);

  const params = await props.searchParams;
  const raw = Array.isArray(params.chargeId) ? params.chargeId[0] : params.chargeId;
  const chargeId = raw?.trim() ?? "";

  return (
    <>
      <PageHeader
        title="Pago de membresía"
        description="Registra el cobro con tarjeta y obtén el comprobante."
      />
      {chargeId ? (
        <PaymentForm chargeId={chargeId} />
      ) : (
        <EmptyState
          icon={Receipt}
          title="No hay un cobro para pagar"
          description="Abre esta pantalla desde el enlace del cobro que compartió recepción; el enlace incluye el identificador del cobro (chargeId)."
        />
      )}
    </>
  );
}
