// lib/api/equipment.ts
// H14 · Cambio de estado de máquinas.
// H15 · Consulta del inventario filtrable por estado.
// Único lugar donde se conoce el contrato de /api/equipment.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  ContractError,
  asRecord,
  readArray,
  readOptionalString,
  readString,
} from "@/lib/api/normalize";
import {
  isEquipmentStatus,
  type Equipment,
  type EquipmentStatus,
  type UpdateEquipmentStatusRequest,
} from "@/lib/types/equipment";

export function normalizeEquipment(raw: unknown, context = "equipo"): Equipment {
  const record = asRecord(raw, context);
  const status = readString(record, context, ["status", "estado"]);

  // Un estado fuera del catálogo es un hueco de contrato, no un estado nuevo.
  if (!isEquipmentStatus(status)) {
    throw new ContractError(
      `${context}.status`,
      `La respuesta de ${context} incluye el estado desconocido "${status}".`
    );
  }

  return {
    id: readString(record, context, ["id", "_id", "equipmentId"]),
    name: readString(record, context, ["name", "nombre"]),
    category: readOptionalString(record, ["category", "categoria"]),
    status,
    reason: readOptionalString(record, ["reason", "motivo"]) ?? null,
    updatedAt: readOptionalString(record, ["updatedAt", "updated_at"]),
  };
}

/** El listado siempre llega ordenado por nombre; el filtro lo aplica el backend. */
export async function listEquipment(status?: EquipmentStatus): Promise<Equipment[]> {
  const query = status ? `?${new URLSearchParams({ status }).toString()}` : "";
  const payload = await apiFetch<unknown>(`${API_ROUTES.equipment.list}${query}`);
  return readArray(payload, "equipos").map((item, index) =>
    normalizeEquipment(item, `equipos[${index}]`)
  );
}

/**
 * `PATCH /api/equipment/:id/status`.
 * El backend puede responder el equipo completo o un resumen del cambio; la UI
 * se refresca desde el servidor, así que no se normaliza la respuesta.
 */
export async function updateEquipmentStatus(
  id: string,
  input: UpdateEquipmentStatusRequest
): Promise<void> {
  await apiFetch<unknown>(API_ROUTES.equipment.updateStatus(id), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
