import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession, getSessionData } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const token = await getSession();
  if (!token) redirect("/login");

  // El rol depende del claim `role` del JWT. Si el token no lo trae, el sidebar
  // queda vacío en lugar de asumir un rol.
  const session = await getSessionData();

  return (
    <SidebarProvider>
      <AppSidebar role={session?.role} />
      <SidebarInset>
        <AppHeader email={session?.email} role={session?.role} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
