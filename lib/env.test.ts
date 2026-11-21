import { afterEach, describe, expect, it } from "vitest";

import { buildApiUrl } from "@/lib/env";

const originalBackend = process.env.BACKEND_URL;
const originalApi = process.env.API_URL;

afterEach(() => {
  process.env.BACKEND_URL = originalBackend;
  process.env.API_URL = originalApi;
});

describe("buildApiUrl", () => {
  it("respeta host y puerto configurados", () => {
    delete process.env.API_URL;
    process.env.BACKEND_URL = "http://localhost:7758";
    expect(buildApiUrl("/api/users").toString()).toBe(
      "http://localhost:7758/api/users"
    );
  });

  it("admite una ruta base en la URL", () => {
    delete process.env.API_URL;
    process.env.BACKEND_URL = "https://api.ejemplo.com/v1/";
    expect(buildApiUrl("/api/plans?active=true").toString()).toBe(
      "https://api.ejemplo.com/v1/api/plans?active=true"
    );
  });

  it("no duplica el prefijo /api cuando la base ya lo incluye", () => {
    delete process.env.API_URL;
    process.env.BACKEND_URL = "http://localhost:8000/api";
    expect(buildApiUrl("/api/notifications/send").toString()).toBe(
      "http://localhost:8000/api/notifications/send"
    );
  });

  it("BACKEND_URL tiene prioridad sobre el alias API_URL", () => {
    process.env.BACKEND_URL = "http://localhost:9001";
    process.env.API_URL = "http://localhost:8000";
    expect(buildApiUrl("/api/users").toString()).toBe(
      "http://localhost:9001/api/users"
    );
  });

  it("sigue aceptando API_URL por compatibilidad", () => {
    delete process.env.BACKEND_URL;
    process.env.API_URL = "http://localhost:8000";
    expect(buildApiUrl("/api/users").toString()).toBe(
      "http://localhost:8000/api/users"
    );
  });

  it("falla con un mensaje claro cuando no hay URL configurada", () => {
    delete process.env.BACKEND_URL;
    delete process.env.API_URL;
    expect(() => buildApiUrl("/api/users")).toThrow(/BACKEND_URL/);
  });

  it("rechaza una URL sin protocolo http o https", () => {
    delete process.env.API_URL;
    process.env.BACKEND_URL = "localhost:8000";
    expect(() => buildApiUrl("/api/users")).toThrow(/http o https/);
  });
});
