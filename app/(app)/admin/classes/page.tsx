import type { Metadata } from "next";

import { listClassSessions } from "@/lib/api/classes";
import { listTrainers } from "@/lib/api/trainers";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { AdminClassesTable } from "@/components/classes/admin-classes-table";
import { PageHeader } from "@/components/page-header";
import { RetryError } from "@/components/states/retry-error";
import type { ClassSession } from "@/lib/types/classes";
import type { TrainerSummary } from "@/lib/types/trainers";

export const metadata: Metadata = { title: "Clases" };

export default async function AdminClassesPage() {
  await requireRole(["RECEPCION_ADMIN"]);

  let sessions: ClassSession[] = [];
  let trainers: TrainerSummary[] = [];
  let error: string | null = null;

  try {
    [sessions, trainers] = await Promise.all([listClassSessions(), listTrainers()]);
  } catch (cause) {
    logActionError("GET /api/class-sessions + /api/trainers", cause);
    error = describeApiError(cause, "No pudimos cargar las clases.");
  }

  return (
    <>
      <PageHeader
        title="Clases"
        description="Programa, edita y cancela las clases del club."
      />
      {error ? (
        <RetryError description={error} />
      ) : (
        <AdminClassesTable sessions={sessions} trainers={trainers} />
      )}
    </>
  );
}
