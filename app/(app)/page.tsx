import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  LayoutDashboard,
  UserPlus,
} from "lucide-react";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { MemberDashboard } from "@/components/dashboard/member-dashboard";
import { QuickLinks } from "@/components/dashboard/quick-links";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { TrainerDashboard } from "@/components/dashboard/trainer-dashboard";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { getSessionData } from "@/lib/session";
import type { UserRole } from "@/lib/types/auth";

export const metadata: Metadata = { title: "Panel" };

const ROLE_CONTENT: Record<UserRole, { label: string; tagline: string }> = {
  MIEMBRO: {
    label: "Miembro",
    tagline:
      "Revisa el estado de tu membresía, tus próximas reservas y las clases con cupo disponible.",
  },
  ENTRENADOR: {
    label: "Entrenador",
    tagline:
      "Consulta tus bloques de disponibilidad y las sesiones que ya tienes agendadas.",
  },
  RECEPCION_ADMIN: {
    label: "Recepción / Administración",
    tagline:
      "Sigue el padrón de miembros, la agenda de clases y el catálogo de planes del club.",
  },
};

export default async function DashboardPage() {
  const session = await getSessionData();
  const role = session?.role;

  // El miembro usa una vista propia, sin hero de métricas ni atajos: el menú
  // lateral ya cubre la navegación.
  if (role === "MIEMBRO") {
    return <MemberDashboard email={session?.email} />;
  }

  const content = role ? ROLE_CONTENT[role] : null;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHero
        email={session?.email}
        roleLabel={content?.label}
        tagline={
          content?.tagline ??
          "Tu sesión no incluye un rol válido, así que no hay módulos habilitados."
        }
        actions={role ? <RoleActions role={role} /> : null}
      />

      {role === "RECEPCION_ADMIN" ? (
        <AdminDashboard />
      ) : role === "ENTRENADOR" ? (
        <TrainerDashboard userId={session?.userId} />
      ) : (
        <ErrorState
          title="Rol no identificado"
          description="El token de sesión no incluye el claim «role». Vuelve a iniciar sesión o pide a administración que revise tus permisos."
        />
      )}

      {role ? (
        <section className="flex flex-col gap-3">
          <SectionHeading
            title="Accesos rápidos"
            description="Módulos habilitados para tu rol."
            icon={LayoutDashboard}
          />
          <QuickLinks role={role} />
        </section>
      ) : null}
    </div>
  );
}

function RoleActions({ role }: { role: UserRole }) {
  if (role === "ENTRENADOR") {
    return (
      <Button asChild size="sm">
        <Link href="/trainer/availability">
          <CalendarPlus />
          Mi disponibilidad
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button asChild size="sm">
        <Link href="/admin/members">
          <UserPlus />
          Registrar miembro
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href="/admin/classes">
          <CalendarDays />
          Programar clase
        </Link>
      </Button>
    </>
  );
}
