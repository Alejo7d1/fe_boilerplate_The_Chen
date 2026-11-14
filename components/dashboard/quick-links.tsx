import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { getNavItems } from "@/lib/navigation";
import type { UserRole } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

export interface QuickLinksProps {
  role?: UserRole;
}

/**
 * Accesos directos a los módulos habilitados para el rol.
 * Se derivan de `NAV_ITEMS`, así que nunca muestran secciones inexistentes.
 */
export function QuickLinks({ role }: QuickLinksProps) {
  const items = getNavItems(role).filter((item) => item.href !== "/");

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const content = (
          <>
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                item.available
                  ? "bg-secondary text-secondary-foreground group-hover/link:bg-primary group-hover/link:text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <item.icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {item.title}
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                {item.available ? "Abrir módulo" : "Pronto"}
              </span>
            </span>
            <ArrowUpRight
              aria-hidden
              className={cn(
                "size-4 shrink-0 transition-transform",
                item.available
                  ? "text-muted-foreground group-hover/link:text-primary group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                  : "text-muted-foreground/50"
              )}
            />
          </>
        );

        if (!item.available) {
          return (
            <div
              key={item.href}
              aria-disabled
              className="bg-muted/30 flex items-center gap-3 rounded-xl border border-dashed p-3 opacity-70"
            >
              {content}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group/link bg-card hover:border-primary/40 focus-visible:ring-ring flex items-center gap-3 rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
