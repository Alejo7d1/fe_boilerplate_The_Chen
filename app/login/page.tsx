import type { Metadata } from "next";
import {
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Sparkles,
  Users,
} from "lucide-react";

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
  title: "Iniciar sesión",
};

const highlights = [
  {
    icon: CalendarCheck,
    label: "Reserva tus clases",
    detail: "Mira los próximos 7 días y aparta tu cupo.",
  },
  {
    icon: CreditCard,
    label: "Tu membresía",
    detail: "Plan, vencimiento y clases disponibles.",
  },
  {
    icon: Users,
    label: "Sesión personal",
    detail: "Agenda un bloque con tu entrenador.",
  },
];

export default function LoginPage() {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <aside className="bg-card relative isolate hidden flex-col justify-between overflow-hidden border-r p-12 lg:flex">
        <div aria-hidden className="bg-radial-glow absolute inset-0 -z-10" />
        <div
          aria-hidden
          className="bg-grid absolute inset-0 -z-10 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        />

        <div className="relative flex items-center gap-3">
          <span className="from-primary to-info text-primary-foreground flex size-10 items-center justify-center rounded-xl bg-linear-to-br shadow-sm">
            <Dumbbell className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold">The Chen</span>
            <span className="text-muted-foreground text-xs">Fitness club</span>
          </span>
          <span className="border-primary/20 bg-background/70 text-muted-foreground ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur">
            <Sparkles className="text-primary size-3" aria-hidden />
            Bienvenido
          </span>
        </div>

        <div className="relative max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance">
              Tu club te espera
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Entra para reservar tus clases, revisar tu membresía y agendar
              sesiones con tu entrenador. Todo desde un solo lugar.
            </p>
          </div>

          <ul className="space-y-2.5">
            {highlights.map(({ icon: Icon, label, detail }) => (
              <li
                key={label}
                className="bg-background/60 flex items-start gap-3 rounded-xl border p-3 backdrop-blur"
              >
                <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-muted-foreground text-xs leading-relaxed">
                    {detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative border-t pt-6">
          <p className="text-muted-foreground text-xs leading-relaxed">
            ¿No recuerdas tus datos? Pídelos en recepción y te ayudamos a
            entrar.
          </p>
        </div>
      </aside>

      <section className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-4 sm:px-6">
          <span className="flex items-center gap-2 lg:hidden">
            <span className="from-primary to-info text-primary-foreground flex size-8 items-center justify-center rounded-lg bg-linear-to-br">
              <Dumbbell className="size-4" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">The Chen</span>
              <span className="text-muted-foreground text-[11px]">
                Fitness club
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
                  Entra con el correo con el que estás registrado en el club.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm />
              </CardContent>
              <CardFooter className="justify-center text-center text-xs text-muted-foreground">
                ¿No recuerdas tus datos? Pídelos en recepción.
              </CardFooter>
            </Card>

            <p className="text-muted-foreground text-center text-[11px] tracking-[0.14em] uppercase">
              The Chen · Fitness club
            </p>
          </div>
        </main>
      </section>
    </div>
  );
}
