"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getNavItems } from "@/lib/navigation";
import type { UserRole } from "@/lib/types/auth";

export function AppSidebar({ role }: { role?: UserRole }) {
  const pathname = usePathname();
  const items = getNavItems(role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="The Chen">
              <Link href="/">
                <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Dumbbell className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5 leading-none">
                  <span className="font-heading font-semibold">The Chen</span>
                  <span className="text-muted-foreground text-xs">
                    Fitness club
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground px-2 text-xs">
                Tu sesión no incluye un rol válido, por lo que no hay secciones
                disponibles.
              </p>
            ) : (
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild={item.available}
                      isActive={pathname === item.href}
                      disabled={!item.available}
                      tooltip={item.title}
                    >
                      {item.available ? (
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      ) : (
                        <>
                          <item.icon />
                          <span>{item.title}</span>
                        </>
                      )}
                    </SidebarMenuButton>
                    {item.available ? null : (
                      <SidebarMenuBadge className="hidden group-data-[collapsible=icon]:hidden md:block">
                        Pronto
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
