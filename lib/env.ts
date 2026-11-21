// lib/env.ts
// Resolución de la URL del backend. Un solo lugar para validarla y para
// construir los endpoints; las rutas relativas de `API_ROUTES` nunca se
// concatenan a mano.

const MISSING_API_URL =
  "Falta la URL del backend. Define BACKEND_URL (o API_URL) en .env con el formato http://host:puerto.";

/**
 * `BACKEND_URL` es el nombre preferido; `API_URL` se mantiene por
 * compatibilidad. `BACKEND_URL` gana si ambas están definidas.
 *
 * Admite protocolo, puerto y una ruta base:
 * `http://localhost:8000`, `http://localhost:8000/` o `http://localhost:8000/v1`.
 */
export function getApiBaseUrl(): URL {
  const raw = (process.env.BACKEND_URL ?? process.env.API_URL)?.trim();
  if (!raw) throw new Error(MISSING_API_URL);

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      `La URL del backend no es válida: «${raw}». Usa el formato http://host:puerto[/ruta].`
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`La URL del backend debe usar http o https (recibido «${raw}»).`);
  }

  return url;
}

/**
 * Construye la URL final de un endpoint declarado en `API_ROUTES`. Si la base
 * ya termina en `/api` no se duplica el prefijo del endpoint.
 */
export function buildApiUrl(endpoint: string): URL {
  const url = getApiBaseUrl();
  const [rawPath, rawQuery = ""] = endpoint.split("?");
  let path = rawPath.replace(/^\/+/, "");
  const basePath = url.pathname.replace(/\/+$/, "");

  if (basePath.endsWith("/api") && path.startsWith("api/")) {
    path = path.slice("api/".length);
  }

  url.pathname = `${basePath}/${path}`.replace(/\/{2,}/g, "/");
  url.search = rawQuery ? `?${rawQuery}` : "";
  url.hash = "";
  return url;
}

let loggedTarget = false;

/** En desarrollo deja una traza de a qué backend se está llamando. */
export function logApiTargetOnce(): void {
  if (loggedTarget || process.env.NODE_ENV === "production") return;
  loggedTarget = true;
  try {
    console.info(`[api] Backend en ${getApiBaseUrl().toString()}`);
  } catch {
    // El error real se reporta cuando la petición intenta construir la URL.
  }
}
