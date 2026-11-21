// lib/session.ts
import { cookies } from "next/headers";
import type { UserRole } from "@/lib/types/auth";

export const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionData {
  token: string;
  userId?: string;
  role?: UserRole;
  email?: string;
}

export async function createSession(
  token: string,
  { remember = true }: { remember?: boolean } = {}
) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Sin "expires" la cookie dura hasta cerrar el navegador (sesión no recordada)
    ...(remember ? { expires: new Date(Date.now() + SESSION_DURATION_MS) } : {}),
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function getSessionData(): Promise<SessionData | null> {
  const token = await getSession();
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;

    const decoded = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8")
    );

    // Si el JWT trae fecha de expiración (exp en segundos), valida que siga vigente
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      token,
      userId: decoded.sub ?? decoded.id ?? decoded.userId,
      role: decoded.role as UserRole,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}