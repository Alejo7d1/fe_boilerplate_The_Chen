import type { Metadata } from "next";
import Link from "next/link";

import { listMyReservations } from "@/lib/api/reservations";
import { describeApiError, logActionError } from "@/lib/actions/errors";
import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/page-header";
import { ReservationsTable } from "@/components/reservations/reservations-table";
import { EmptyState } from "@/components/states/empty-state";
import { RetryError } from "@/components/states/retry-error";
import { Button } from "@/components/ui/button";
import type { ClassReservation } from "@/lib/types/classes";

export const metadata: Metadata = { title: "Mis reservas" };

export default async function MyReservationsPage() {
  await requireRole(["MIEMBRO"]);

  let reservations: ClassReservation[] = [];
  let error: string | null = null;

  try {
    reservations = await listMyReservations();
  } catch (cause) {
    logActionError("GET /api/reservations/me", cause);
    error = describeApiError(cause, "No pudimos cargar tus reservas.");
  }

  return (
    <>
      <PageHeader
        title="Mis reservas"
        description="Consulta las clases que reservaste y cancela las que no puedas asistir."
      />
      {error ? (
        <RetryError description={error} />
      ) : reservations.length === 0 ? (
        <EmptyState
          title="No tienes reservas"
          description="Reserva un cupo en alguna de las clases de los próximos 7 días."
          action={
            <Button asChild>
              <Link href="/classes/book">Reservar clase</Link>
            </Button>
          }
        />
      ) : (
        <ReservationsTable reservations={reservations} />
      )}
    </>
  );
}
