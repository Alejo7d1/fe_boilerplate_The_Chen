import { describe, expect, it } from "vitest";

import {
  normalizeCreatedReview,
  normalizeReviewAnalytics,
  normalizeReviewAverage,
} from "@/lib/api/reviews";
import { ContractError } from "@/lib/api/normalize";

describe("normalizeCreatedReview", () => {
  it("normaliza la respuesta del alta", () => {
    expect(
      normalizeCreatedReview(
        {
          reviewId: "review-1",
          sessionId: "class-yoga",
          rating: 5,
          createdAt: "2026-11-20T17:43:15.049Z",
        },
        { sessionId: "class-yoga", rating: 5 }
      )
    ).toEqual({
      id: "review-1",
      sessionId: "class-yoga",
      rating: 5,
      createdAt: "2026-11-20T17:43:15.049Z",
    });
  });

  it("completa sesión y estrellas con lo enviado cuando el backend no las devuelve", () => {
    expect(
      normalizeCreatedReview({ reviewId: "review-2" }, { sessionId: "class-yoga", rating: 4 })
    ).toEqual({
      id: "review-2",
      sessionId: "class-yoga",
      rating: 4,
      createdAt: undefined,
    });
  });

  it("lanza ContractError sin identificador", () => {
    expect(() =>
      normalizeCreatedReview({ sessionId: "class-yoga" }, { sessionId: "class-yoga", rating: 4 })
    ).toThrow(ContractError);
  });
});

describe("normalizeReviewAverage", () => {
  it("lee la forma del backend de pruebas", () => {
    expect(
      normalizeReviewAverage({
        targetType: "TRAINER",
        targetId: "usr-trainer",
        targetName: "Carlos Mendoza",
        average: 4.25,
        totalReviews: 8,
      })
    ).toEqual({
      targetType: "TRAINER",
      targetId: "usr-trainer",
      targetName: "Carlos Mendoza",
      average: 4.25,
      totalReviews: 8,
    });
  });

  it("acepta la forma documentada por BE-17.1 con tipo inferior", () => {
    expect(
      normalizeReviewAverage(
        { trainerId: "usr-trainer", trainerName: "Carlos Mendoza", average: "4.5" },
        "promedios.byTrainer[0]",
        "TRAINER"
      )
    ).toEqual({
      targetType: "TRAINER",
      targetId: "usr-trainer",
      targetName: "Carlos Mendoza",
      average: 4.5,
      totalReviews: null,
    });
  });

  it("mantiene en null el promedio sin calificaciones", () => {
    expect(
      normalizeReviewAverage({
        targetType: "TRAINER",
        targetId: "usr-trainer",
        targetName: "Carlos Mendoza",
        average: null,
        totalReviews: 0,
      })
    ).toEqual({
      targetType: "TRAINER",
      targetId: "usr-trainer",
      targetName: "Carlos Mendoza",
      average: null,
      totalReviews: 0,
    });
  });

  it("lanza ContractError cuando falta el nombre del objetivo", () => {
    expect(() =>
      normalizeReviewAverage({ targetType: "TRAINER", targetId: "usr-trainer" })
    ).toThrow(ContractError);
  });
});

describe("normalizeReviewAnalytics", () => {
  it("lee el envoltorio del backend de pruebas", () => {
    const rows = normalizeReviewAnalytics({
      data: [
        {
          targetType: "TRAINER",
          targetId: "usr-trainer",
          targetName: "Carlos Mendoza",
          average: null,
          totalReviews: 0,
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].targetName).toBe("Carlos Mendoza");
  });

  it("combina la forma byTrainer / byClass de BE-17.1", () => {
    const rows = normalizeReviewAnalytics({
      byTrainer: [{ trainerId: "usr-trainer", trainerName: "Carlos Mendoza", average: 4 }],
      byClass: [{ classId: "class-yoga", className: "Yoga Flow", average: 5, totalReviews: 2 }],
    });

    expect(rows).toEqual([
      {
        targetType: "TRAINER",
        targetId: "usr-trainer",
        targetName: "Carlos Mendoza",
        average: 4,
        totalReviews: null,
      },
      {
        targetType: "CLASS",
        targetId: "class-yoga",
        targetName: "Yoga Flow",
        average: 5,
        totalReviews: 2,
      },
    ]);
  });
});
