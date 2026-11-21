import type { Metadata } from "next";

import { searchMembers } from "@/lib/api/members";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { MembersTable } from "@/components/members/members-table";
import { PageHeader } from "@/components/page-header";
import { RetryError } from "@/components/states/retry-error";
import type { MemberSummary } from "@/lib/types/members";

export const metadata: Metadata = { title: "Miembros" };

export default async function AdminMembersPage() {
  await requireRole(["RECEPCION_ADMIN"]);

  let members: MemberSummary[] = [];
  let error: string | null = null;

  try {
    members = await searchMembers("");
  } catch (cause) {
    logActionError("GET /api/users", cause);
    error = describeApiError(cause, "No pudimos cargar los miembros.");
  }

  return (
    <>
      <PageHeader
        title="Miembros"
        description="Registra miembros nuevos y consulta el padrón del club."
      />
      {error ? <RetryError description={error} /> : <MembersTable members={members} />}
    </>
  );
}
