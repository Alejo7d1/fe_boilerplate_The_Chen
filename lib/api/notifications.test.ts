import { describe, expect, it } from "vitest";

import { normalizeSentNotification } from "@/lib/api/notifications";
import { ContractError } from "@/lib/api/normalize";

describe("normalizeSentNotification", () => {
  it("lee la confirmación del envío", () => {
    expect(
      normalizeSentNotification({
        sent: 2,
        notificationIds: ["n-1", "n-2"],
      })
    ).toEqual({ sent: 2, notificationIds: ["n-1", "n-2"] });
  });

  it("acepta `sent` como texto numérico", () => {
    expect(
      normalizeSentNotification({ sent: "1", notificationIds: ["n-1"] })
    ).toEqual({ sent: 1, notificationIds: ["n-1"] });
  });

  it("lanza ContractError cuando falta la lista de IDs", () => {
    expect(() => normalizeSentNotification({ sent: 1 })).toThrow(ContractError);
  });

  it("lanza ContractError cuando `sent` no es un número", () => {
    expect(() =>
      normalizeSentNotification({ sent: "varios", notificationIds: ["n-1"] })
    ).toThrow(ContractError);
  });
});
