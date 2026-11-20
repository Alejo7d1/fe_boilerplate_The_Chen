import { LogOut } from "lucide-react";

import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/types/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  MIEMBRO: "Miembro",
  ENTRENADOR: "Entrenador",
  RECEPCION_ADMIN: "Recepción / Administración",
};

function initialsFrom(email?: string): string {
  if (!email) return "TC";
  const localPart = email.split("@")[0] ?? "";
  const parts = localPart.split(/[.\-_]+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]);
  return (initials.join("") || localPart.slice(0, 2) || "TC").toUpperCase();
}

export function AppHeader({
  email,
  role,
}: {
  email?: string;
  role?: UserRole;
}) {
  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-xl">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="from-primary to-info text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[0.7rem] font-semibold">
          {initialsFrom(email)}
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-medium">
            {email ?? "Sesión sin correo"}
          </span>
          <span className="text-muted-foreground truncate text-xs">
            {role ? ROLE_LABELS[role] : "Rol no identificado"}
          </span>
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
