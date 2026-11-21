import type { Metadata } from "next";

import { listPlans } from "@/lib/api/plans";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { PurchaseForm } from "@/components/memberships/purchase-form";
import { EmptyState } from "@/components/states/empty-state";
import { RetryError } from "@/components/states/retry-error";
import type { MembershipPlan } from "@/lib/types/plans";

export const metadata: Metadata = { title: "Compra y renovación" };

export default async function PurchaseMembershipPage() {
  await requireRole(["RECEPCION_ADMIN"]);

  let plans: MembershipPlan[] = [];
  let error: string | null = null;

  try {
    plans = await listPlans();
  } catch (cause) {
    logActionError("GET /api/plans", cause);
    error = describeApiError(cause, "No pudimos cargar los planes disponibles.");
  }

  return (
    <>
      <PageHeader
        title="Compra y renovación"
        description="Registra la compra o renovación de la membresía de un miembro."
      />
      {error ? (
        <RetryError description={error} />
      ) : plans.length === 0 ? (
        <EmptyState
          title="No hay planes disponibles"
          description="Crea al menos un plan de membresía antes de registrar una compra."
        />
      ) : (
        <PurchaseForm plans={plans} />
      )}
    </>
  );
}
