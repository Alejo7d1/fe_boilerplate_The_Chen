"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
            <SidebarMenuButton asChild size="lg" tooltip="Chen Fitness Club">
              <Link href="/">
                <Image
                  src="/icon_chen.png"
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 shrink-0 object-contain"
                  preload
                />
                <span className="flex flex-col gap-0.5 leading-none">
                  <span className="font-heading from-primary to-info bg-linear-to-r bg-clip-text font-semibold text-transparent">
                    Chen Fitness Club
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Sistema de gestión
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
                      className="data-active:font-medium data-active:[&_svg]:text-sidebar-primary"
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
