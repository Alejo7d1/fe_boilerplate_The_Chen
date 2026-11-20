import { describe, expect, it } from "vitest";

import { normalizeEquipment } from "@/lib/api/equipment";
import { ContractError } from "@/lib/api/normalize";

describe("normalizeEquipment", () => {
  it("normaliza el DTO del backend de pruebas", () => {
    expect(
      normalizeEquipment({
        id: "eq-002",
        name: "Prensa de Pecho",
        category: "Fuerza",
        status: "En Mantenimiento",
        reason: "Calibración preventiva",
      })
    ).toEqual({
      id: "eq-002",
      name: "Prensa de Pecho",
      category: "Fuerza",
      status: "En Mantenimiento",
      reason: "Calibración preventiva",
      updatedAt: undefined,
    });
  });

  it("deja el motivo en null cuando la máquina está operativa", () => {
    const equipment = normalizeEquipment({
      id: "eq-001",
      name: "Caminadora",
      status: "Operativa",
      reason: null,
    });
    expect(equipment.reason).toBeNull();
  });

  it("rechaza un estado fuera del catálogo en lugar de inventarlo", () => {
    expect(() => normalizeEquipment({ id: "eq-3", name: "Remo", status: "Rota" })).toThrow(
      ContractError
    );
  });
});
