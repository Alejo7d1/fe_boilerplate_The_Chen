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

export function AppHeader({
  email,
  role,
}: {
  email?: string;
  role?: UserRole;
}) {
  return (
    <header className="bg-background/95 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-4" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">
          {email ?? "Sesión sin correo"}
        </span>
        <span className="text-muted-foreground truncate text-xs">
          {role ? ROLE_LABELS[role] : "Rol no identificado"}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-1">
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
