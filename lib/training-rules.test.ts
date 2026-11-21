import { describe, expect, it } from "vitest";

import { parseMetric, validateExercises, validateProgress } from "@/lib/training-rules";

const TODAY = "2026-11-20";

describe("parseMetric", () => {
  it("acepta números y texto con coma decimal", () => {
    expect(parseMetric("78.5")).toBe(78.5);
    expect(parseMetric("78,5")).toBe(78.5);
    expect(parseMetric(80)).toBe(80);
  });

  it("devuelve NaN para texto vacío o inválido", () => {
    expect(parseMetric("")).toBeNaN();
    expect(parseMetric("abc")).toBeNaN();
    expect(parseMetric(undefined)).toBeNaN();
  });
});

describe("validateProgress", () => {
  const base = { date: TODAY, weight: "78.5", waist: "84", chest: "102" };

  it("normaliza una medición válida", () => {
    const result = validateProgress({ ...base, strengthMarks: [" Press banca ", ""] }, TODAY);
    if (!("input" in result)) throw new Error("se esperaba una medición válida");
    expect(result.input).toEqual({
      date: TODAY,
      weight: 78.5,
      waist: 84,
      chest: 102,
      strengthMarks: ["Press banca"],
    });
  });

  it("rechaza fechas futuras", () => {
    const result = validateProgress({ ...base, date: "2026-11-21" }, TODAY);
    expect(result.fieldErrors?.date).toBe("La fecha no puede ser futura.");
  });

  it("aplica los rangos del contrato a cada métrica", () => {
    const result = validateProgress(
      { date: TODAY, weight: "19", waist: "29", chest: "301" },
      TODAY
    );
    expect(result.fieldErrors?.weight).toContain("20 y 500");
    expect(result.fieldErrors?.waist).toContain("30 y 300");
    expect(result.fieldErrors?.chest).toContain("30 y 300");
  });

  it("acepta los límites exactos", () => {
    const result = validateProgress(
      { date: TODAY, weight: "20", waist: "30", chest: "300" },
      TODAY
    );
    expect(result.fieldErrors).toBeUndefined();
  });
});

describe("validateExercises", () => {
  it("exige al menos un ejercicio", () => {
    expect(validateExercises([]).fieldErrors?.exercises).toBe(
      "Agrega al menos un ejercicio."
    );
  });

  it("normaliza nombres y convierte series y reps a número", () => {
    const result = validateExercises([
      { name: "  Sentadilla ", series: "4", reps: "12" },
    ]);
    if (!("exercises" in result)) throw new Error("se esperaba una rutina válida");
    expect(result.exercises).toEqual([{ name: "Sentadilla", series: 4, reps: 12 }]);
  });

  it("marca el índice del ejercicio inválido", () => {
    const result = validateExercises([
      { name: "Sentadilla", series: "4", reps: "12" },
      { name: " ", series: "0", reps: "0" },
    ]);
    expect(result.fieldErrors?.["exercises.1.name"]).toBeDefined();
    expect(result.fieldErrors?.["exercises.1.series"]).toBeDefined();
    expect(result.fieldErrors?.["exercises.1.reps"]).toBeDefined();
  });

  it("rechaza series o reps no enteras", () => {
    const result = validateExercises([{ name: "Remo", series: "2.5", reps: "10" }]);
    expect(result.fieldErrors?.["exercises.0.series"]).toBeDefined();
  });

  it("limita la cantidad de ejercicios por rutina", () => {
    const rows = Array.from({ length: 31 }, () => ({
      name: "Remo",
      series: "3",
      reps: "10",
    }));
    expect(validateExercises(rows).fieldErrors?.exercises).toContain("30");
  });
});
