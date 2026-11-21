// lib/api/members.ts
// Miembros del club: búsqueda (H2) y alta.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  readArray,
  readOptionalString,
  readString,
} from "@/lib/api/normalize";
import type { CreateMemberRequest, MemberSummary } from "@/lib/types/members";

function normalizeMember(raw: unknown, context: string): MemberSummary {
  const record = asRecord(raw, context);
  const fullName = readOptionalString(record, ["name", "fullName", "nombreCompleto"]);
  const firstName = readOptionalString(record, ["nombre", "firstName"]);
  const lastName = readOptionalString(record, ["apellido", "lastName"]);
  const email = readOptionalString(record, ["email", "correo"]);

  const name =
    fullName ??
    [firstName, lastName].filter(Boolean).join(" ").trim() ??
    "";

  return {
    id: readString(record, context, ["id", "_id", "userId", "memberId"]),
    name: name || email || "",
    email,
    cardNumber: readOptionalString(record, ["cardNumber", "carnet"]),
    role: readOptionalString(record, ["role", "rol"]),
  };
}

/** Miembros filtrados por rol y texto. Sin `query` devuelve el listado completo de miembros. */
export async function searchMembers(query: string): Promise<MemberSummary[]> {
  const params = new URLSearchParams({ role: "MIEMBRO" });
  if (query.trim()) params.set("search", query.trim());

  const payload = await apiFetch<unknown>(
    `${API_ROUTES.members.search}?${params.toString()}`
  );

  return readArray(payload, "miembros")
    .map((item, index) => normalizeMember(item, `miembros[${index}]`))
    .filter((member) => Boolean(member.id));
}

/** Alta de miembro. Solo `RECEPCION_ADMIN` (la acción valida el rol antes de llamar). */
export async function createMember(
  input: CreateMemberRequest
): Promise<MemberSummary> {
  const payload = await apiFetch<unknown>(API_ROUTES.members.create, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeMember(payload, "miembro creado");
}
