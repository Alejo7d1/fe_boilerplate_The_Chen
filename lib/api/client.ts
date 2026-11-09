export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Punto único de salida hacia el backend externo.
export async function apiRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("Falta la variable de entorno API_URL.");
  }

  return fetch(new URL(path.replace(/^\/+/, ""), apiUrl.replace(/\/?$/, "/")), {
    cache: "no-store",
    ...init,
  });
}

// Extrae el mensaje del backend para mostrarlo en la interfaz.
export async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    const message = data?.message ?? data?.error ?? data?.detail;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  } catch {
    // Respuesta sin cuerpo JSON: se usa el mensaje por defecto.
  }
  return `La solicitud falló con el código ${res.status}.`;
}
