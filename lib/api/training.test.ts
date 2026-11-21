import { describe, expect, it } from "vitest";

import {
  normalizeCreatedProgress,
  normalizeProgressEntry,
  normalizeRoutine,
} from "@/lib/api/training";
import { ContractError } from "@/lib/api/normalize";

describe("normalizeRoutine", () => {
  it("normaliza la respuesta del alta", () => {
    expect(
      normalizeRoutine({
        routineId: "routine-1",
        memberId: "usr-member",
        updatedAt: "2026-11-20T17:09:34.346Z",
      })
    ).toEqual({
      id: "routine-1",
      memberId: "usr-member",
      updatedAt: "2026-11-20T17:09:34.346Z",
    });
  });

  it("lanza ContractError sin identificador ni miembro", () => {
    expect(() => normalizeRoutine({ memberId: "usr-member" })).toThrow(ContractError);
    expect(() => normalizeRoutine({ routineId: "routine-1" })).toThrow(ContractError);
  });
});

describe("normalizeCreatedProgress", () => {
  it("completa las métricas con lo enviado y respeta la fecha del backend", () => {
    const entry = normalizeCreatedProgress(
      { progressId: "progress-1", memberId: "usr-member", date: "2026-11-20" },
      { date: "2026-11-19", weight: 78.5, waist: 84, chest: 102, strengthMarks: [] }
    );

    expect(entry).toEqual({
      id: "progress-1",
      memberId: "usr-member",
      date: "2026-11-20",
      weight: 78.5,
      waist: 84,
      chest: 102,
      strengthMarks: [],
    });
  });

  it("usa la fecha enviada cuando el backend no la devuelve", () => {
    const entry = normalizeCreatedProgress(
      { progressId: "progress-2" },
      { date: "2026-11-19", weight: 70, waist: 80, chest: 95 }
    );
    expect(entry.date).toBe("2026-11-19");
  });
});

describe("normalizeProgressEntry", () => {
  it("acepta nombres alternativos y descarta marcas no textuales", () => {
    expect(
      normalizeProgressEntry({
        progressId: "progress-3",
        fecha: "2026-11-01T10:00:00.000Z",
        peso: "80.5",
        cintura: 85,
        pecho: 101,
        strengthMarks: ["Sentadilla 120 kg", 42],
      })
    ).toEqual({
      id: "progress-3",
      memberId: undefined,
      date: "2026-11-01",
      weight: 80.5,
      waist: 85,
      chest: 101,
      strengthMarks: ["Sentadilla 120 kg"],
    });
  });

  it("lanza ContractError cuando falta una métrica", () => {
    expect(() =>
      normalizeProgressEntry({ id: "progress-4", date: "2026-11-01", weight: 80 })
    ).toThrow(ContractError);
  });
});
