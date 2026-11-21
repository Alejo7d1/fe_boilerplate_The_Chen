import { describe, expect, it } from "vitest";

import {
  normalizeFinancialReport,
  normalizeOccupancyReportRow,
} from "@/lib/api/reports";

describe("normalizeFinancialReport", () => {
  it("normaliza los nombres reales devueltos por la API de pruebas", () => {
    expect(
      normalizeFinancialReport({
        totalRevenue: 2450,
        renovationRate: 35.5,
      })
    ).toEqual({
      period: undefined,
      totalRevenue: 2450,
      paymentCount: undefined,
      renewals: undefined,
      renewalRate: 35.5,
    });
  });

  it("normaliza el contrato propuesto por el backend", () => {
    expect(
      normalizeFinancialReport({
        period: "2026-11",
        totalIncome: 3000,
        paymentCount: 12,
        renewals: 8,
        renewalRate: 66.67,
      })
    ).toEqual({
      period: "2026-11",
      totalRevenue: 3000,
      paymentCount: 12,
      renewals: 8,
      renewalRate: 66.67,
    });
  });
});

describe("normalizeOccupancyReportRow", () => {
  it("conserva solo los campos observados por la API", () => {
    expect(
      normalizeOccupancyReportRow({
        className: "Yoga",
        occupancyPercentage: 75,
      })
    ).toEqual({
      id: undefined,
      className: "Yoga",
      date: undefined,
      startTime: undefined,
      maxCapacity: undefined,
      reservedCount: undefined,
      availableSpots: undefined,
      occupancyRate: undefined,
      occupancyPercentage: 75,
    });
  });

  it("tolera el contrato completo sin inventar valores", () => {
    expect(
      normalizeOccupancyReportRow({
        className: "CrossFit",
        date: "2026-11-20",
        startTime: "18:00",
        maxCapacity: 20,
        reservedCount: 14,
        availableSpots: 6,
        occupancyRate: 70,
      })
    ).toMatchObject({
      className: "CrossFit",
      date: "2026-11-20",
      startTime: "18:00",
      maxCapacity: 20,
      reservedCount: 14,
      availableSpots: 6,
      occupancyRate: 70,
    });
  });
});
