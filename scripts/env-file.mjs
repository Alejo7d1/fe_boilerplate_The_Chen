// scripts/env-file.mjs
// Lectura mínima de .env / .env.local para el lanzador de Next. `next dev` no
// carga los .env para decidir su puerto, así que el lanzador los lee aquí.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function parseEnvFile(file) {
  const values = {};
  if (!existsSync(file)) return values;

  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;

    const key = match[1];
    let value = (match[2] ?? "").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

/** Replica la precedencia de Next.js: `.env` y luego `.env.local`. */
export function readEnvFiles(cwd = process.cwd()) {
  return {
    ...parseEnvFile(path.join(cwd, ".env")),
    ...parseEnvFile(path.join(cwd, ".env.local")),
  };
}

/** Puerto e interfaz del frontend: variable del proceso > archivo > valor por defecto. */
export function resolveServerOptions(
  env = readEnvFiles(),
  processEnv = process.env
) {
  return {
    port:
      processEnv.FE_PORT || env.FE_PORT || processEnv.PORT || env.PORT || "3000",
    hostname: processEnv.FE_HOST || env.FE_HOST || undefined,
  };
}
