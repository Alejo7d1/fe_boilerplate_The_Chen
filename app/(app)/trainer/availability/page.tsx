import type { Metadata } from "next";

import { describeApiError, logActionError } from "@/lib/actions/errors";
import { listTrainerAvailability } from "@/lib/api/trainers";
import { requireRole } from "@/lib/auth-guard";
import { todayIso } from "@/lib/date-range";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/states/error-state";
import { RetryError } from "@/components/states/retry-error";
import { AvailabilityBoard } from "@/components/trainers/availability-board";
import type { TrainerAvailabilitySlot } from "@/lib/types/trainers";

export const metadata: Metadata = { title: "Mi disponibilidad" };

export default async function TrainerAvailabilityPage() {
  const session = await requireRole(["ENTRENADOR"]);

  const header = (
    <PageHeader
      title="Mi disponibilidad"
      description="Registra bloques de 60 minutos entre las 06:00 y las 21:00 para que los miembros puedan agendar sesiones personales."
    />
  );

  if (!session.userId) {
    return (
      <>
        {header}
        <ErrorState
          title="No pudimos identificar tu cuenta"
          description="Tu sesión no incluye el identificador del usuario (claim «sub»), así que no es posible cargar tu disponibilidad. Vuelve a iniciar sesión."
        />
      </>
    );
  }

  let slots: TrainerAvailabilitySlot[] = [];
  let error: string | null = null;

  try {
    slots = await listTrainerAvailability(session.userId);
  } catch (cause) {
    logActionError("GET /api/trainers/:id/availability", cause);
    error = describeApiError(cause, "No pudimos cargar tu disponibilidad.");
  }

  return (
    <>
      {header}
      {error ? (
        <RetryError
          title="No pudimos cargar tu disponibilidad"
          description={error}
        />
      ) : (
        <AvailabilityBoard slots={slots} today={todayIso()} />
      )}
    </>
  );
}
