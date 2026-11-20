import type { ReactNode } from "react";
import { CalendarDays, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { todayIso } from "@/lib/date-range";
import { formatLongDate, nameFromEmail } from "@/lib/format";

export interface DashboardHeroProps {
  email?: string;
  roleLabel?: string;
  tagline: string;
  actions?: ReactNode;
}

/** Encabezado del panel: saludo, contexto del rol y acciones principales. */
export function DashboardHero({
  email,
  roleLabel,
  tagline,
  actions,
}: DashboardHeroProps) {
  const greeting = nameFromEmail(email) ?? "de nuevo";

  return (
    <section className="bg-card relative isolate overflow-hidden rounded-2xl border">
      <div aria-hidden className="bg-radial-glow absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="bg-grid absolute inset-0 -z-10 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
      />

      <div className="flex flex-col gap-6 p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <Badge
              variant="outline"
              className="border-primary/25 bg-background/70 gap-1.5 backdrop-blur"
            >
              <Sparkles className="text-primary size-3" aria-hidden />
              {roleLabel ? `Panel · ${roleLabel}` : "Panel"}
            </Badge>
            <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-balance">
              Hola,{" "}
              <span className="from-primary via-primary to-info bg-linear-to-r bg-clip-text text-transparent">
                {greeting}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1.5 max-w-xl text-sm">
              {tagline}
            </p>
          </div>

          <div className="bg-background/70 flex items-center gap-3 rounded-xl border px-3 py-2 shadow-xs backdrop-blur">
            <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              <CalendarDays className="size-4" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-muted-foreground text-[0.62rem] font-medium tracking-[0.08em] uppercase">
                Hoy
              </span>
              <span className="text-sm font-medium capitalize">
                {formatLongDate(todayIso())}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {email ? (
            <span className="text-muted-foreground ml-auto truncate text-xs">
              Sesión iniciada como <span className="text-foreground font-medium">{email}</span>
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
