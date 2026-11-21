import { describe, expect, it } from "vitest";

import { errorMessageFrom } from "@/lib/api";

describe("errorMessageFrom", () => {
  it("lee el campo `error` del backend de pruebas", () => {
    expect(errorMessageFrom({ error: "Carné no encontrado" }, 404)).toBe(
      "Carné no encontrado"
    );
  });

  it("sigue aceptando `message`", () => {
    expect(errorMessageFrom({ message: "Cupo agotado" }, 409)).toBe("Cupo agotado");
  });

  it("cae al código HTTP cuando no hay mensaje", () => {
    expect(errorMessageFrom({}, 500)).toBe("Error HTTP 500");
    expect(errorMessageFrom(undefined, 400)).toBe("Error HTTP 400");
  });
});
