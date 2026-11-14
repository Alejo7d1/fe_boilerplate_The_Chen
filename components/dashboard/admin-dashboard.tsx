import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  Gauge,
  Tags,
  UserRound,
  Users,
} from "lucide-react";

import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DataErrorNote } from "@/components/dashboard/data-error-note";
import { DatePill } from "@/components/dashboard/date-pill";
import { CapacityBar } from "@/components/capacity-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { listClassSessions } from "@/lib/api/classes";
import { searchMembers } from "@/lib/api/members";
import { listPlans } from "@/lib/api/plans";
import {
  occupiedSeats,
  readSettled,
  sumOccupancy,
  upcomingSessions,
} from "@/lib/dashboard";
import { formatCurrency, formatDuration } from "@/lib/format";
import { classTone, planLabel, planTone } from "@/lib/status";

export async function AdminDashboard() {
  const [membersResult, plansResult, sessionsResult] = await Promise.allSettled([
    searchMembers(""),
    listPlans(),
    listClassSessions(),
  ]);

  const members = readSettled(
    membersResult,
    "GET /api/users",
    "No pudimos cargar los miembros."
  );
  const plans = readSettled(
    plansResult,
    "GET /api/plans",
    "No pudimos cargar los planes."
  );
  const sessions = readSettled(
    sessionsResult,
    "GET /api/class-sessions",
    "No pudimos cargar las clases."
  );

  const activePlans = plans.data?.filter((plan) => plan.active) ?? [];
  const nextSessions = sessions.data ? upcomingSessions(sessions.data, 5) : [];
  const occupancy = sessions.data
    ? sumOccupancy(upcomingSessions(sessions.data))
    : { occupied: 0, capacity: 0 };
  const occupancyPercent =
    occupancy.capacity > 0
      ? Math.round((occupancy.occupied / occupancy.capacity) * 100)
      : 0;
  const featuredMembers = (members.data ?? []).slice(0, 6);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Miembros"
          value={members.data ? String(members.data.length) : "—"}
          hint={members.error ?? "Padrón del club"}
          icon={Users}
          tone="primary"
          href="/admin/members"
        />
        <StatCard
          label="Planes activos"
          value={
            plans.data ? `${activePlans.length}/${plans.data.length}` : "—"
          }
          hint={plans.error ?? "Disponibles en recepción"}
          icon={Tags}
          tone="accent"
          href="/admin/plans"
        />
        <StatCard
          label="Clases próximas"
          value={
            sessions.data ? String(upcomingSessions(sessions.data).length) : "—"
          }
          hint={sessions.error ?? "Desde hoy en adelante"}
          icon={CalendarDays}
          tone="info"
          href="/admin/classes"
        />
        <StatCard
          label="Ocupación"
          value={sessions.data && occupancy.capacity > 0 ? `${occupancyPercent}%` : "—"}
          hint={
            sessions.error ??
            (occupancy.capacity > 0
              ? `${occupancy.occupied} de ${occupancy.capacity} cupos`
              : "Sin clases programadas")
          }
          icon={Gauge}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardPanel
          title="Próximas clases"
          description="Agenda desde hoy con la ocupación de cada sesión."
          icon={CalendarClock}
          action={{ label: "Ver clases", href: "/admin/classes" }}
          className="lg:col-span-3"
        >
          {sessions.error ? <DataErrorNote message={sessions.error} /> : null}

          {nextSessions.length === 0 ? (
            <EmptyState
              title="No hay clases programadas"
              description="Programa la primera sesión desde el módulo de clases."
              icon={CalendarDays}
              action={
                <Button asChild size="sm">
                  <Link href="/admin/classes">Ir a clases</Link>
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {nextSessions.map((session) => (
                <li
                  key={session.id}
                  className="bg-muted/40 hover:bg-muted/70 flex items-center gap-3 rounded-lg border p-2.5 transition-colors"
                >
                  <DatePill iso={session.date} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{session.name}</p>
                      <StatusBadge
                        label={session.status}
                        tone={classTone(session.status)}
                      />
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                      {session.startTime} · {formatDuration(session.durationMinutes)} ·{" "}
                      {session.trainerName}
                    </p>
                    <CapacityBar
                      occupied={occupiedSeats(session)}
                      capacity={session.maxCapacity}
                    />
                  </div>
                  <span className="text-muted-foreground shrink-0 text-right text-xs tabular-nums">
                    {occupiedSeats(session)}/{session.maxCapacity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Planes de membresía"
          description="Catálogo vigente y precios."
          icon={Tags}
          action={{ label: "Gestionar", href: "/admin/plans" }}
          className="lg:col-span-2"
        >
          {plans.error ? <DataErrorNote message={plans.error} /> : null}

          {plans.data && plans.data.length === 0 ? (
            <EmptyState
              title="Aún no hay planes"
              description="Crea el primer plan para poder vender membresías."
              icon={Tags}
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {(plans.data ?? []).slice(0, 4).map((plan) => (
                <li
                  key={plan.id}
                  className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{plan.name}</p>
                    <StatusBadge label={planLabel(plan.active)} tone={planTone(plan.active)} />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatCurrency(plan.price)} · {plan.durationDays} días
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Miembros del club"
        description="Vista rápida del padrón registrado."
        icon={Users}
        action={{ label: "Ver padrón", href: "/admin/members" }}
      >
        {members.error ? <DataErrorNote message={members.error} /> : null}

        {featuredMembers.length === 0 ? (
          <EmptyState
            title="Sin miembros registrados"
            description="Registra al primer miembro para empezar."
            icon={UserRound}
            action={
              <Button asChild size="sm">
                <Link href="/admin/members">Registrar miembro</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {featuredMembers.map((member) => (
              <li
                key={member.id}
                className="bg-muted/40 hover:bg-muted/70 flex items-center gap-3 rounded-lg border p-2.5 transition-colors"
              >
                <span className="bg-primary/10 text-primary font-heading flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold uppercase">
                  {memberInitials(member.name, member.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {member.cardNumber ?? member.email ?? "Sin carnet registrado"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardPanel>
    </>
  );
}

function memberInitials(name: string, email?: string): string {
  const source = name.trim() || email?.trim() || "";
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]);
  return initials.join("") || "?";
}
