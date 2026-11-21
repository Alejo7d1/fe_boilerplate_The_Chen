import { describe, expect, it } from "vitest";

import {
  normalizePaymentReceipt,
  normalizePendingCharge,
  normalizePendingChargesPage,
} from "@/lib/api/payments";
import { ContractError } from "@/lib/api/normalize";

describe("normalizePendingCharge", () => {
  it("normaliza el DTO del backend con nombres alternativos", () => {
    expect(
      normalizePendingCharge({
        chargeId: "chg-1",
        memberId: "usr-9",
        memberName: "Ana López",
        cardNumber: "MEM-2026-0009",
        concepto: "Renovación mensual",
        monto: "150.00",
        fecha: "2026-11-01T10:00:00.000Z",
        estado: "PENDIENTE",
      })
    ).toEqual({
      id: "chg-1",
      memberId: "usr-9",
      memberName: "Ana López",
      memberCardNumber: "MEM-2026-0009",
      concept: "Renovación mensual",
      amount: 150,
      dueDate: "2026-11-01",
      status: "PENDIENTE",
    });
  });

  it("toma el nombre del miembro anidado", () => {
    const charge = normalizePendingCharge({
      id: "chg-2",
      amount: 90,
      member: { id: "usr-3", name: "Luis Pérez" },
    });
    expect(charge.memberName).toBe("Luis Pérez");
    expect(charge.dueDate).toBeUndefined();
  });

  it("lanza ContractError cuando no hay monto", () => {
    expect(() => normalizePendingCharge({ id: "chg-3" })).toThrow(ContractError);
  });

  it("lanza ContractError cuando no hay identificador", () => {
    expect(() => normalizePendingCharge({ amount: 120 })).toThrow(ContractError);
  });
});

describe("normalizePendingChargesPage", () => {
  it("usa la paginación que envía el backend", () => {
    const page = normalizePendingChargesPage(
      {
        data: [{ id: "chg-1", amount: 150 }],
        total: 23,
        page: 2,
        limit: 10,
        totalPages: 3,
      },
      { page: 2, limit: 10 }
    );

    expect(page.charges).toHaveLength(1);
    expect(page).toMatchObject({ total: 23, page: 2, limit: 10, totalPages: 3 });
  });

  it("calcula la paginación sobre lo recibido cuando el backend no la envía", () => {
    const page = normalizePendingChargesPage(
      [{ id: "chg-1", amount: 150 }, { id: "chg-2", amount: 90 }],
      { page: 1, limit: 1 }
    );

    expect(page).toMatchObject({ total: 2, page: 1, limit: 1, totalPages: 2 });
  });
});

describe("normalizePaymentReceipt", () => {
  it("acepta el comprobante envuelto en data", () => {
    expect(
      normalizePaymentReceipt(
        {
          data: {
            receiptNumber: "REC-00042",
            amount: 150,
            paidAt: "2026-11-20T15:30:00.000Z",
            concept: "Renovación mensual",
            last4: "1234",
            status: "PAGADO",
          },
        },
        "9999"
      )
    ).toEqual({
      receiptNumber: "REC-00042",
      amount: 150,
      paidAt: "2026-11-20",
      concept: "Renovación mensual",
      last4: "1234",
      status: "PAGADO",
    });
  });

  it("usa los últimos cuatro dígitos enviados cuando el backend no los devuelve", () => {
    const receipt = normalizePaymentReceipt({ receiptNumber: "REC-00043" }, "5678");
    expect(receipt.last4).toBe("5678");
    expect(receipt.amount).toBeUndefined();
  });

  it("lanza ContractError sin número de comprobante", () => {
    expect(() => normalizePaymentReceipt({ status: "PAGADO" })).toThrow(ContractError);
  });
});
