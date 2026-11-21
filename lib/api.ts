// lib/api.ts
import { buildApiUrl, logApiTargetOnce } from "@/lib/env";
import { getSession } from "@/lib/session";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * El backend de pruebas responde `{ "error": "..." }`; otros entornos usan
 * `message`. Los errores de validación (`400`) traen `message` como array de
 * strings. Se aceptan todas las formas para no perder el mensaje original.
 */
export function errorMessageFrom(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    for (const key of ["message", "error", "detail"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (Array.isArray(value)) {
        const parts = value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
        if (parts.length > 0) return parts.join(" ");
      }
    }
  }
  return `Error HTTP ${status}`;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { requireAuth?: boolean } = {}
): Promise<T> {
  const { requireAuth = true, headers, ...rest } = options;
  const authHeaders: Record<string, string> = {};

  if (requireAuth) {
    const token = await getSession();
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = buildApiUrl(endpoint);
  logApiTargetOnce();

  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorMessageFrom(errorData, res.status));
  }

  // 204 (p. ej. DELETE de reservas) y respuestas sin cuerpo no se pueden parsear como JSON.
  if (res.status === 204) return undefined as unknown as T;

  const body = await res.text();
  if (!body.trim()) return undefined as unknown as T;

  return JSON.parse(body) as T;
}