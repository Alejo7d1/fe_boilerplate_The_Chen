'use server';
// FE-4.2 — El token vive en una cookie httpOnly, así que el POST se hace desde el servidor.
// Ajusta este import al helper real de tu lib/ (el que ya usan login/logout para leer la sesión).
import { getSession } from '@/lib/session';

export type ReserveResult =
  | { ok: true; reservationId: string }
  | { ok: false; status: number; message: string };

export async function reserveClass(sessionId: string): Promise<ReserveResult> {
  const token = await getSession();
  if (!token) return { ok: false, status: 401, message: 'Tu sesión expiró. Inicia sesión de nuevo.' };

  try {
    const res = await fetch(`${process.env.API_URL}/class-sessions/${sessionId}/reserve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 201) return { ok: true, reservationId: body.reservationId };
    return { ok: false, status: res.status, message: body.message ?? 'No se pudo reservar. Intenta de nuevo.' };
  } catch {
    return { ok: false, status: 0, message: 'No se pudo reservar. Intenta de nuevo.' };
  }
}
