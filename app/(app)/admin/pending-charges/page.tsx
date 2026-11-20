import type { Metadata } from "next";

import { listPendingCharges } from "@/lib/api/payments";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { PendingChargesTable } from "@/components/payments/pending-charges-table";
import { RetryError } from "@/components/states/retry-error";
import {
  PENDING_CHARGES_PAGE_SIZE,
  type PendingChargesPage,
} from "@/lib/types/payments";

export const metadata: Metadata = { title: "Cobros pendientes" };

const EMPTY_PAGE: PendingChargesPage = {
  charges: [],
  page: 1,
  limit: PENDING_CHARGES_PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export default async function AdminPendingChargesPage() {
  await requireRole(["RECEPCION_ADMIN"]);

  let page = EMPTY_PAGE;
  let error: string | null = null;

  try {
    page = await listPendingCharges({ page: 1, limit: PENDING_CHARGES_PAGE_SIZE });
  } catch (cause) {
    logActionError("GET /api/charges/pending", cause);
    error = describeApiError(cause, "No pudimos cargar los cobros pendientes.");
  }

  return (
    <>
      <PageHeader
        title="Cobros pendientes"
        description="Consulta los cobros pendientes de pago y fíltralos por miembro o rango de fechas."
      />
      {error ? (
        <RetryError description={error} />
      ) : (
        <PendingChargesTable page={page} />
      )}
    </>
  );
}
