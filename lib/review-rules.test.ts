import { describe, expect, it } from "vitest";

import {
  buildReviewableClasses,
  isFinishedClass,
  isReviewWindowOpen,
  reviewDeadline,
  reviewTargetLabel,
  validateReview,
} from "@/lib/review-rules";
import type { ClassReservation, ClassSession } from "@/lib/types/classes";

function session(overrides: Partial<ClassSession> = {}): ClassSession {
  return {
    id: "class-yoga",
    name: "Yoga Flow",
    trainerId: "usr-trainer",
    trainerName: "Carlos Mendoza",
    date: "2026-11-10",
    startTime: "08:00",
    durationMinutes: 60,
    maxCapacity: 20,
    availableSpots: 18,
    status: "Finalizada",
    ...overrides,
  };
}

function reservation(overrides: Partial<ClassReservation> = {}): ClassReservation {
  return {
    id: "reservation-1",
    classId: "class-yoga",
    name: "Yoga Flow",
    date: "2026-11-10",
    startTime: "08:00",
    status: "Activa",
    ...overrides,
  };
}

describe("validateReview", () => {
  it("normaliza una reseña válida y recorta el comentario", () => {
    expect(
      validateReview({ sessionId: " class-yoga ", rating: "4", comment: "  Muy buena  " })
    ).toEqual({
      input: { sessionId: "class-yoga", rating: 4, comment: "Muy buena" },
    });
  });

  it("omite el comentario cuando viene vacío", () => {
    expect(validateReview({ sessionId: "class-yoga", rating: 5, comment: "   " })).toEqual({
      input: { sessionId: "class-yoga", rating: 5 },
    });
  });

  it("rechaza estrellas fuera de 1–5 y valores no enteros", () => {
    expect(validateReview({ sessionId: "class-yoga", rating: 0 }).fieldErrors).toHaveProperty(
      "rating"
    );
    expect(validateReview({ sessionId: "class-yoga", rating: 6 }).fieldErrors).toHaveProperty(
      "rating"
    );
    expect(validateReview({ sessionId: "class-yoga", rating: 4.5 }).fieldErrors).toHaveProperty(
      "rating"
    );
  });

  it("rechaza la clase vacía y los comentarios de más de 300 caracteres", () => {
    expect(validateReview({ sessionId: "  ", rating: 3 }).fieldErrors).toHaveProperty(
      "sessionId"
    );
    expect(
      validateReview({ sessionId: "class-yoga", rating: 3, comment: "a".repeat(301) })
        .fieldErrors
    ).toHaveProperty("comment");
  });
});

describe("ventana de calificación", () => {
  it("permite calificar hasta el séptimo día inclusive", () => {
    expect(isReviewWindowOpen("2026-11-10", "2026-11-10")).toBe(true);
    expect(isReviewWindowOpen("2026-11-10", "2026-11-17")).toBe(true);
  });

  it("cierra el plazo al octavo día y no admite clases futuras", () => {
    expect(isReviewWindowOpen("2026-11-10", "2026-11-18")).toBe(false);
    expect(isReviewWindowOpen("2026-11-10", "2026-11-09")).toBe(false);
  });

  it("calcula la fecha límite y descarta fechas mal formadas", () => {
    expect(reviewDeadline("2026-11-10")).toBe("2026-11-17");
    expect(isReviewWindowOpen("10/11/2026", "2026-11-12")).toBe(false);
  });
});

describe("buildReviewableClasses", () => {
  it("conserva solo reservas activas sobre clases finalizadas", () => {
    const classes = buildReviewableClasses(
      [
        reservation(),
        reservation({ id: "reservation-2", classId: "class-crossfit" }),
        reservation({ id: "reservation-3", classId: "class-cancelled" }),
        reservation({ id: "reservation-4", classId: "class-missing" }),
      ],
      [
        session(),
        session({ id: "class-crossfit", name: "CrossFit", status: "Programada" }),
        session({ id: "class-cancelled", status: "Cancelada" }),
      ]
    );

    expect(classes).toEqual([
      {
        sessionId: "class-yoga",
        name: "Yoga Flow",
        trainerName: "Carlos Mendoza",
        date: "2026-11-10",
        startTime: "08:00",
      },
    ]);
  });

  it("deduplica la clase y las ordena de la más reciente a la más antigua", () => {
    const classes = buildReviewableClasses(
      [
        reservation(),
        reservation({ id: "reservation-2" }),
        reservation({ id: "reservation-3", classId: "class-crossfit" }),
      ],
      [
        session(),
        session({ id: "class-crossfit", name: "CrossFit", date: "2026-11-12" }),
      ]
    );

    expect(classes.map((item) => item.sessionId)).toEqual(["class-crossfit", "class-yoga"]);
  });
});

describe("etiquetas de estado y objetivo", () => {
  it("reconoce la clase finalizada sin distinguir mayúsculas", () => {
    expect(isFinishedClass("Finalizada")).toBe(true);
    expect(isFinishedClass(" finalizada ")).toBe(true);
    expect(isFinishedClass("Programada")).toBe(false);
  });

  it("traduce los tipos de objetivo conocidos y deja el resto tal cual", () => {
    expect(reviewTargetLabel("TRAINER")).toBe("Entrenador");
    expect(reviewTargetLabel("CLASS")).toBe("Clase");
    expect(reviewTargetLabel("SESSION")).toBe("SESSION");
  });
});
