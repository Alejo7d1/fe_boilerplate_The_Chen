import { describe, expect, it } from "vitest";

import {
  formatCardNumberInput,
  formatExpiryInput,
  last4Of,
  parseExpiry,
  validateCardNumber,
  validateCvv,
  validateExpiry,
  validateHolder,
} from "@/lib/payment-card";

const TODAY = "2026-11-20";

describe("payment card helpers", () => {
  it("deja solo dígitos y corta el número de tarjeta en 16", () => {
    expect(formatCardNumberInput("4111 1111-1111 1111 9999")).toBe("4111111111111111");
  });

  it("inserta la barra del vencimiento mientras se escribe", () => {
    expect(formatExpiryInput("1")).toBe("1");
    expect(formatExpiryInput("12")).toBe("12");
    expect(formatExpiryInput("1229")).toBe("12/29");
    expect(formatExpiryInput("12/299")).toBe("12/29");
  });

  it("valida el titular entre 3 y 100 caracteres", () => {
    expect(validateHolder("  ")).not.toBeNull();
    expect(validateHolder("AB")).not.toBeNull();
    expect(validateHolder("Ana López")).toBeNull();
    expect(validateHolder("x".repeat(101))).not.toBeNull();
  });

  it("exige 16 dígitos en la tarjeta", () => {
    expect(validateCardNumber("411111111111111")).not.toBeNull();
    expect(validateCardNumber("4111 1111 1111 1111")).toBeNull();
  });

  it("acepta CVV de 3 o 4 dígitos", () => {
    expect(validateCvv("12")).not.toBeNull();
    expect(validateCvv("123")).toBeNull();
    expect(validateCvv("1234")).toBeNull();
    expect(validateCvv("12345")).not.toBeNull();
  });

  it("rechaza vencimientos pasados y formatos inválidos", () => {
    expect(validateExpiry("", TODAY)).not.toBeNull();
    expect(validateExpiry("13/27", TODAY)).not.toBeNull();
    expect(validateExpiry("1026", TODAY)).not.toBeNull();
    expect(validateExpiry("10/26", TODAY)).not.toBeNull();
    expect(validateExpiry("11/26", TODAY)).toBeNull();
    expect(validateExpiry("01/30", TODAY)).toBeNull();
  });

  it("convierte MM/YY al año completo que espera el backend", () => {
    expect(parseExpiry("01/30")).toEqual({ month: 1, year: 2030 });
    expect(parseExpiry("1/30")).toBeNull();
  });

  it("deriva los últimos cuatro dígitos del número enviado", () => {
    expect(last4Of("4111 1111 1111 1234")).toBe("1234");
    expect(last4Of("123")).toBeUndefined();
  });
});
