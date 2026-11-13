// lib/auth-guard.ts
// Guard de rol para páginas y Server Actions.
// Es una defensa de UI: el backend sigue siendo la autoridad de autorización.

import { redirect } from "next/navigation";

import { getSessionData, type SessionData } from "@/lib/session";
import type { UserRole } from "@/lib/types/auth";

/**
 * Exige una sesión válida con uno de los roles indicados.
 * Sin sesión → `/login`. Rol no autorizado → `/`.
 */
export async function requireRole(roles: readonly UserRole[]): Promise<SessionData> {
  const session = await getSessionData();
  if (!session) redirect("/login");
  if (!session.role || !roles.includes(session.role)) redirect("/");
  return session;
}

/** Comprobación no redirigente, usada dentro de las Server Actions. */
export async function hasAnyRole(roles: readonly UserRole[]): Promise<boolean> {
  const session = await getSessionData();
  return Boolean(session?.role && roles.includes(session.role));
}
