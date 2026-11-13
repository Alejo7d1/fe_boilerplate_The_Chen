// lib/api.ts
import { getSession } from "@/lib/session"; 

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { requireAuth?: boolean } = {}
): Promise<T> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) throw new Error("Falta la variable de entorno API_URL.");

  const { requireAuth = true, headers, ...rest } = options;
  const authHeaders: Record<string, string> = {};

  if (requireAuth) {
    const token = await getSession();
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = new URL(endpoint.replace(/^\//, ""), apiUrl.replace(/\/?$/, "/"));
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
    throw new ApiError(res.status, errorData.message || `Error HTTP ${res.status}`);
  }

  // 204 (p. ej. DELETE de reservas) y respuestas sin cuerpo no se pueden parsear como JSON.
  if (res.status === 204) return undefined as unknown as T;

  const body = await res.text();
  if (!body.trim()) return undefined as unknown as T;

  return JSON.parse(body) as T;
}