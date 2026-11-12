import type { Metadata } from "next";
import { Dumbbell, Lock, ShieldCheck } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso interno",
};

const modules = [
  { label: "Miembros", detail: "Altas y expedientes" },
  { label: "Membresías", detail: "Vigencias y renovaciones" },
  { label: "Pagos", detail: "Cobros y conciliación" },
  { label: "Clases", detail: "Horarios y cupos" },
  { label: "Entrenadores", detail: "Turnos y asignaciones" },
  { label: "Equipamiento", detail: "Inventario y mantenimiento" },
];

export default function LoginPage() {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-zinc-50 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_15%_0%,rgba(255,255,255,0.12),transparent_65%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px]"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <Dumbbell className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-semibold">The Chen</span>
            <span className="text-xs text-zinc-400">Panel administrativo</span>
          </span>
          <span className="ml-auto rounded-md border border-white/15 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-zinc-400 uppercase">
            Interno
          </span>
        </div>

        <div className="relative max-w-md space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[11px] tracking-[0.16em] text-zinc-300 uppercase">
              <Lock className="size-3" aria-hidden />
              Área restringida
            </span>
            <h1 className="font-heading text-4xl font-semibold text-balance">
              Acceso al panel de administración
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Consola interna para la operación diaria del club. Ingresa con
              las credenciales asignadas por administración de sistemas.
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
              Módulos del panel
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {modules.map(({ label, detail }) => (
                <li
                  key={label}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <span className="block text-sm font-medium text-zinc-100">
                    {label}
                  </span>
                  <span className="block text-[11px] leading-relaxed text-zinc-500">
                    {detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative border-t border-white/10 pt-6">
          <p className="flex items-start gap-3 text-xs leading-relaxed text-zinc-400">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            Uso exclusivo del personal autorizado. La sesión se mantiene activa
            hasta 7 días si eliges «Mantener la sesión iniciada»; de lo
            contrario, finaliza al cerrar el navegador.
          </p>
        </div>
      </aside>

      <section className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-4 sm:px-6">
          <span className="flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Dumbbell className="size-4" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">The Chen</span>
              <span className="text-[11px] text-muted-foreground">
                Panel administrativo
              </span>
            </span>
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-16">
          <div className="w-full max-w-sm space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Iniciar sesión</CardTitle>
                <CardDescription>
                  Identifícate con tu cuenta de personal para continuar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm />
              </CardContent>
              <CardFooter className="justify-center text-center text-xs text-muted-foreground">
                ¿Sin acceso? Solicita credenciales a administración de
                sistemas.
              </CardFooter>
            </Card>

            <p className="text-center font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              The Chen · entorno interno
            </p>
          </div>
        </main>
      </section>
    </div>
  );
}
