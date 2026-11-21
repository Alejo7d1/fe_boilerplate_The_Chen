import { describe, expect, it } from "vitest";

import {
  activeReservedSessionIds,
  compareSessionsNewestFirst,
  isSessionBookable,
  sessionEndsAt,
} from "@/lib/classes";
import type { ClassReservation, ClassSession } from "@/lib/types/classes";

function session(overrides: Partial<ClassSession> = {}): ClassSession {
  return {
    id: "class-1",
    name: "Yoga",
    trainerId: "trainer-1",
    trainerName: "Ana",
    date: "2026-11-21",
    startTime: "13:00",
    durationMinutes: 60,
    maxCapacity: 10,
    availableSpots: 4,
    status: "Programada",
    ...overrides,
  };
}

const NOW = new Date(2026, 10, 21, 12, 0, 0);

describe("isSessionBookable", () => {
  it("oculta las clases que ya terminaron hoy", () => {
    expect(
      isSessionBookable(
        session({ startTime: "11:00", durationMinutes: 60 }),
        NOW
      )
    ).toBe(false);
  });

  it("mantiene las clases programadas que todavía no terminan", () => {
    expect(
      isSessionBookable(
        session({ startTime: "13:00", durationMinutes: 60 }),
        NOW
      )
    ).toBe(true);
  });

  it("oculta las clases finalizadas o canceladas aunque sean futuras", () => {
    expect(
      isSessionBookable(session({ date: "2026-11-22", status: "Finalizada" }), NOW)
    ).toBe(false);
    expect(
      isSessionBookable(session({ date: "2026-11-22", status: "Cancelada" }), NOW)
    ).toBe(false);
  });

  it("calcula el fin sumando la duración", () => {
    expect(sessionEndsAt(session({ startTime: "10:30", durationMinutes: 45 }))).toEqual(
      new Date(2026, 10, 21, 11, 15, 0)
    );
  });
});

describe("compareSessionsNewestFirst", () => {
  it("ordena de la sesión más reciente a la más antigua", () => {
    const rows = [
      session({ id: "a", date: "2026-11-20", startTime: "18:00" }),
      session({ id: "b", date: "2026-11-22", startTime: "08:00" }),
      session({ id: "c", date: "2026-11-22", startTime: "19:00" }),
    ].sort(compareSessionsNewestFirst);

    expect(rows.map((row) => row.id)).toEqual(["c", "b", "a"]);
  });
});

describe("activeReservedSessionIds", () => {
  it("solo cuenta las reservas vigentes", () => {
    const reservations: ClassReservation[] = [
      {
        id: "r1",
        classId: "class-1",
        name: "Yoga",
        date: "2026-11-21",
        startTime: "13:00",
        status: "Activa",
      },
      {
        id: "r2",
        classId: "class-2",
        name: "Pesas",
        date: "2026-11-22",
        startTime: "09:00",
        status: "Cancelada",
      },
    ];

    expect([...activeReservedSessionIds(reservations)]).toEqual(["class-1"]);
  });
});
