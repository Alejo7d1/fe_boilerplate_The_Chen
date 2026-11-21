import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = {
  primary: "bg-primary/10 text-primary ring-primary/20",
  accent: "bg-accent text-accent-foreground ring-accent-foreground/15",
  success: "bg-success/12 text-success ring-success/25",
  warning: "bg-warning/25 text-warning-foreground ring-warning/40",
  info: "bg-info/12 text-info ring-info/25",
  muted: "bg-muted text-muted-foreground ring-border",
} as const;

export type StatTone = keyof typeof TONES;

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: StatTone;
  href?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  href,
}: StatCardProps) {
  const card = (
    <Card
      className={cn(
        "group/stat relative transition-all duration-200",
        href && "hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <span
        aria-hidden
        className="from-primary/50 via-info/40 pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r to-transparent opacity-0 transition-opacity duration-200 group-hover/stat:opacity-100"
      />
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-[0.68rem] font-medium tracking-[0.08em] uppercase">
            {label}
          </span>
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg ring-1 transition-colors",
              TONES[tone]
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-heading truncate text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </span>
          {hint ? (
            <span className="text-muted-foreground truncate text-xs">{hint}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link
      href={href}
      className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
    >
      {card}
    </Link>
  );
}
