// scripts/serve.mjs
// Arranca `next dev` o `next start` respetando el puerto configurado.
//
// `next dev` solo acepta el puerto por `--port` o por la variable PORT del
// proceso: un PORT escrito en .env no lo lee el CLI. Este lanzador lee los
// mismos archivos que Next (.env y luego .env.local) y pasa `--port` explícito,
// de modo que cambiar FE_PORT en .env cambia el puerto del frontend.
//
// Uso: node scripts/serve.mjs dev|start [...args]

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

import { resolveServerOptions } from "./env-file.mjs";

const mode = process.argv[2] === "start" ? "start" : "dev";
const extraArgs = process.argv.slice(3);
const cwd = process.cwd();

const { port, hostname } = resolveServerOptions();

const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(nextBin)) {
  console.error(
    "[serve] No se encontró Next.js. Ejecuta `npm install` antes de arrancar el servidor."
  );
  process.exit(1);
}

const args = [nextBin, mode, "--port", String(port)];
if (hostname) args.push("--hostname", hostname);
args.push(...extraArgs);

console.log(`[serve] next ${mode} en http://localhost:${port}`);

const child = spawn(process.execPath, args, { stdio: "inherit" });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(`[serve] No se pudo arrancar Next.js: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
