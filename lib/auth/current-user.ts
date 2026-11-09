import { getSession } from "@/lib/session";

export type SessionUser = {
  id: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
};

function decodePayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }
  try {
    const json = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Chequeo optimista del usuario a partir del token de sesión. Si el backend
// usa tokens opacos, el rol queda en null y la autorización real la aplica la API.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSession();
  if (!token) {
    return null;
  }

  const claims = decodePayload(token);
  const read = (key: string) => {
    const value = claims?.[key];
    return typeof value === "string" ? value : null;
  };

  return {
    id: read("sub"),
    email: read("email"),
    name: read("name"),
    role: read("role"),
  };
}
