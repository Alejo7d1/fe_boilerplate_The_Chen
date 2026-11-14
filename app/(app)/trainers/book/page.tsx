import type { Metadata } from "next";
import { Users } from "lucide-react";

import { describeApiError, logActionError } from "@/lib/actions/errors";
import { listTrainerAvailability, listTrainers } from "@/lib/api/trainers";
import { requireRole } from "@/lib/auth-guard";
import { nextDays } from "@/lib/date-range";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { RetryError } from "@/components/states/retry-error";
import { PersonalSessionBoard } from "@/components/trainers/personal-session-board";
import type {
  TrainerAvailabilitySlot,
  TrainerSummary,
} from "@/lib/types/trainers";

export const metadata: Metadata = { title: "Sesión personal" };

const WINDOW_DAYS = 14;

export default async function BookPersonalSessionPage(props: {
  searchParams: Promise<{ trainer?: string | string[] }>;
}) {
  await requireRole(["MIEMBRO"]);

  const params = await props.searchParams;
  const requested = Array.isArray(params.trainer) ? params.trainer[0] : params.trainer;

  // Ventana de 14 días calculada en el servidor para evitar desajustes de hidratación.
  const days = nextDays(WINDOW_DAYS);
  const window = new Set(days);

  let trainers: TrainerSummary[] = [];
  let slots: TrainerAvailabilitySlot[] = [];
  let selectedId: string | null = null;
  let error: string | null = null;

  try {
    trainers = await listTrainers();
    const selected =
      trainers.find((trainer) => trainer.id === requested) ?? trainers[0] ?? null;
    selectedId = selected?.id ?? null;

    if (selected) {
      const availability = await listTrainerAvailability(selected.id);
      slots = availability.filter((slot) => window.has(slot.date));
    }
  } catch (cause) {
    logActionError("GET /api/trainers/:id/availability", cause);
    error = describeApiError(
      cause,
      "No pudimos cargar las sesiones personales disponibles."
    );
  }

  return (
    <>
      <PageHeader
        title="Sesión personal"
        description="Elige un entrenador y un bloque libre en los próximos 14 días."
      />
      {error ? (
        <RetryError title="No pudimos cargar la agenda" description={error} />
      ) : !selectedId ? (
        <EmptyState
          title="No hay entrenadores disponibles"
          description="Cuando el club registre entrenadores podrás agendar una sesión personal."
          icon={Users}
        />
      ) : (
        <PersonalSessionBoard
          key={selectedId}
          trainers={trainers}
          selectedTrainerId={selectedId}
          slots={slots}
          days={days}
        />
      )}
    </>
  );
}
