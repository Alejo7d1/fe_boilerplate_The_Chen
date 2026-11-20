import { describe, expect, it } from "vitest";

import { normalizeCheckIn } from "@/lib/api/access";
import { ContractError } from "@/lib/api/normalize";

describe("normalizeCheckIn", () => {
  it("acepta el resultado Permitido", () => {
    expect(
      normalizeCheckIn({
        accessId: "access-1",
        memberName: "Miembro Activo",
        result: "Permitido",
        timestamp: "2026-11-20T07:00:00.000Z",
      })
    ).toEqual({
      accessId: "access-1",
      memberName: "Miembro Activo",
      result: "Permitido",
      timestamp: "2026-11-20T07:00:00.000Z",
    });
  });

  it("acepta el resultado Excepcion", () => {
    const result = normalizeCheckIn({
      accessId: "access-2",
      memberName: "Miembro Vencido",
      result: "Excepcion",
    });
    expect(result.result).toBe("Excepcion");
  });

  it("rechaza un resultado fuera del contrato", () => {
    expect(() =>
      normalizeCheckIn({ accessId: "a", memberName: "X", result: "Denegado" })
    ).toThrow(ContractError);
  });
});
