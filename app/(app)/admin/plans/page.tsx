import type { Metadata } from "next";

import { listPlans } from "@/lib/api/plans";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { PlansTable } from "@/components/plans/plans-table";
import { RetryError } from "@/components/states/retry-error";
import type { MembershipPlan } from "@/lib/types/plans";

export const metadata: Metadata = { title: "Planes" };

export default async function AdminPlansPage() {
  await requireRole(["RECEPCION_ADMIN"]);

  let plans: MembershipPlan[] = [];
  let error: string | null = null;

  try {
    plans = await listPlans();
  } catch (cause) {
    logActionError("GET /api/plans", cause);
    error = describeApiError(cause, "No pudimos cargar los planes.");
  }

  return (
    <>
      <PageHeader
        title="Planes de membresía"
        description="Define y administra los planes que se ofrecen en recepción."
      />
      {error ? <RetryError description={error} /> : <PlansTable plans={plans} />}
    </>
  );
}
