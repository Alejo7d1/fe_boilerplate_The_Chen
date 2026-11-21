// lib/api/access.ts
// H9 · Check-in de miembros. Único lugar donde se conoce el contrato.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import { ContractError, asRecord, readOptionalString, readString } from "@/lib/api/normalize";
import type { CheckInRequest, CheckInResult } from "@/lib/types/access";

export function normalizeCheckIn(raw: unknown, context = "check-in"): CheckInResult {
  const record = asRecord(raw, context);
  const result = readString(record, context, ["result", "resultado"]);

  if (result !== "Permitido" && result !== "Excepcion") {
    throw new ContractError(
      `${context}.result`,
      `La respuesta de ${context} incluye el resultado desconocido "${result}".`
    );
  }

  return {
    accessId: readString(record, context, ["accessId", "id"]),
    memberName: readString(record, context, ["memberName", "nombre", "name"]),
    result,
    timestamp: readOptionalString(record, ["timestamp", "createdAt"]) ?? "",
  };
}

/** `POST /api/access/check-in` · 201 con resultado `Permitido` o `Excepcion`. */
export async function checkIn(input: CheckInRequest): Promise<CheckInResult> {
  const payload = await apiFetch<unknown>(API_ROUTES.access.checkIn, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeCheckIn(payload);
}
