// lib/api/plans.ts
// H3 · Planes de membresía. Único lugar donde se conoce el contrato de /api/plans.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  readArray,
  readBoolean,
  readNullableNumber,
  readNumber,
  readOptionalString,
  readString,
} from "@/lib/api/normalize";
import type {
  CreatePlanRequest,
  MembershipPlan,
  UpdatePlanRequest,
} from "@/lib/types/plans";

export function normalizePlan(raw: unknown, context = "planes"): MembershipPlan {
  const record = asRecord(raw, context);
  return {
    id: readString(record, context, ["id", "_id", "planId"]),
    name: readString(record, context, ["name", "nombre"]),
    type: readOptionalString(record, ["type", "tipo"]),
    price: readNumber(record, context, ["price", "precio"]),
    durationDays: readNumber(record, context, [
      "durationDays",
      "duration",
      "duracion",
    ]),
    classesIncluded: readNullableNumber(record, context, [
      "classCount",
      "classesIncluded",
      "clasesIncluidas",
    ]),
    benefits: readOptionalString(record, ["benefits", "beneficios"]),
    active: readBoolean(record, context, ["active", "isActive", "activo"]),
  };
}

export async function listPlans(): Promise<MembershipPlan[]> {
  const payload = await apiFetch<unknown>(API_ROUTES.plans.list);
  return readArray(payload, "planes").map((item, index) =>
    normalizePlan(item, `planes[${index}]`)
  );
}

export async function createPlan(
  input: CreatePlanRequest
): Promise<MembershipPlan | null> {
  const payload = await apiFetch<unknown>(API_ROUTES.plans.create, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload === undefined ? null : normalizePlan(payload, "plan creado");
}

export async function updatePlan(
  id: string,
  input: UpdatePlanRequest
): Promise<MembershipPlan | null> {
  const payload = await apiFetch<unknown>(API_ROUTES.plans.update(id), {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return payload === undefined ? null : normalizePlan(payload, "plan actualizado");
}

/** `PATCH /api/plans/:id/status` recibe `{ active: boolean }`. */
export async function setPlanStatus(id: string, active: boolean): Promise<void> {
  await apiFetch<unknown>(API_ROUTES.plans.toggleStatus(id), {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}
