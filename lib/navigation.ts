// lib/navigation.ts
// Navegación del dashboard. Cada historia del sprint activo tiene su entrada.
// `available` se activa cuando la historia se implementa en su fase.

import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Tags,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/lib/types/auth";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  available: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    title: "Panel",
    href: "/",
    icon: LayoutDashboard,
    roles: ["MIEMBRO", "ENTRENADOR", "RECEPCION_ADMIN"],
    available: true,
  },
  {
    title: "Miembros",
    href: "/admin/members",
    icon: UserPlus,
    roles: ["RECEPCION_ADMIN"],
    available: true,
  },
  {
    title: "Mi membresía",
    href: "/membership",
    icon: CreditCard,
    roles: ["MIEMBRO"],
    available: true,
  },
  {
    title: "Compra y renovación",
    href: "/membership/purchase",
    icon: ClipboardList,
    roles: ["RECEPCION_ADMIN"],
    available: true,
  },
  {
    title: "Planes",
    href: "/admin/plans",
    icon: Tags,
    roles: ["RECEPCION_ADMIN"],
    available: true,
  },
  {
    title: "Reservar clase",
    href: "/classes/book",
    icon: CalendarCheck,
    roles: ["MIEMBRO"],
    available: true,
  },
  {
    title: "Mis reservas",
    href: "/my-reservations",
    icon: CalendarDays,
    roles: ["MIEMBRO"],
    available: true,
  },
  {
    title: "Clases",
    href: "/admin/classes",
    icon: ClipboardList,
    roles: ["RECEPCION_ADMIN"],
    available: true,
  },
  {
    title: "Mi disponibilidad",
    href: "/trainer/availability",
    icon: CalendarClock,
    roles: ["ENTRENADOR"],
    available: true,
  },
  {
    title: "Sesión personal",
    href: "/trainers/book",
    icon: Users,
    roles: ["MIEMBRO"],
    available: true,
  },
] as const;

/**
 * Sin rol identificado no se muestra ninguna sección: el sidebar informa
 * que la sesión no trae el claim `role`.
 */
export function getNavItems(role?: UserRole): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
