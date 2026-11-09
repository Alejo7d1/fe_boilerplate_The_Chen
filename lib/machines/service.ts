import { ApiError, apiRequest, readErrorMessage } from "@/lib/api/client";
import type { Machine, MachineStatus } from "@/lib/machines/types";

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwApiError(res: Response): Promise<never> {
  throw new ApiError(res.status, await readErrorMessage(res));
}

function extractList(data: unknown): Machine[] {
  if (Array.isArray(data)) {
    return data as Machine[];
  }
  const wrapped = data as { items?: unknown; data?: unknown } | null;
  if (Array.isArray(wrapped?.items)) {
    return wrapped.items as Machine[];
  }
  if (Array.isArray(wrapped?.data)) {
    return wrapped.data as Machine[];
  }
  return [];
}

// GET /api/equipment -> máquinas ordenadas alfabéticamente por nombre.
export async function listMachines(token?: string): Promise<Machine[]> {
  const res = await apiRequest("api/equipment", {
    method: "GET",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  return extractList(await res.json());
}

// PATCH /api/equipment/:id/status -> máquina con el estado y motivo vigentes.
export async function changeMachineStatus(
  token: string | undefined,
  id: string,
  input: { status: MachineStatus; reason: string | null },
): Promise<Machine> {
  const res = await apiRequest(
    `api/equipment/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ status: input.status, reason: input.reason }),
    },
  );
  if (!res.ok) {
    await throwApiError(res);
  }
  return (await res.json()) as Machine;
}
