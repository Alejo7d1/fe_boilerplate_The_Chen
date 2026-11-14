import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CreditCard,
  Ticket,
} from "lucide-react";

import { ReserveButton } from "@/components/classes/reserve-button";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DataErrorNote } from "@/components/dashboard/data-error-note";
import { DatePill } from "@/components/dashboard/date-pill";
import { MembershipCard } from "@/components/dashboard/membership-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listClassSessions } from "@/lib/api/classes";
import { getMyMembership } from "@/lib/api/memberships";
import { listMyReservations } from "@/lib/api/reservations";
import {
  readSettled,
  upcomingReservations,
  upcomingSessions,
} from "@/lib/dashboard";
import {
  formatDayNumber,
  formatLongDate,
  formatMonthShort,
  formatWeekdayShort,
  nameFromEmail,
} from "@/lib/format";
import { reservationTone } from "@/lib/status";

export interface MemberDashboardProps {
  email?: string;
}

/**
 * Vista del miembro: carnet, próxima clase, clases con cupo y reservas.
 * Deliberadamente sin métricas ni atajos: el menú lateral ya cubre la navegación.
 */
export async function MemberDashboard({ email }: MemberDashboardProps) {
  const [membershipResult, reservationsResult, sessionsResult] =
    await Promise.allSettled([
      getMyMembership(),
      listMyReservations(),
      listClassSessions(),
    ]);

  const membership = readSettled(
    membershipResult,
    "GET /api/memberships/me",
    "No pudimos cargar tu membresía."
  );
  const reservations = readSettled(
    reservationsResult,
    "GET /api/reservations/me",
    "No pudimos cargar tus reservas."
  );
  const sessions = readSettled(
    sessionsResult,
    "GET /api/class-sessions",
    "No pudimos cargar las clases disponibles."
  );

  const greeting = nameFromEmail(email);
  const nextReservation = reservations.data
    ? (upcomingReservations(reservations.data, 1)[0] ?? null)
    : null;
  const nextReservations = reservations.data
    ? upcomingReservations(reservations.data, 4)
    : [];
  const openSessions = sessions.data
    ? upcomingSessions(sessions.data).filter((session) => session.availableSpots > 0)
    : [];
  const featuredSessions = openSessions.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {greeting ? `Hola, ${greeting}` : "Hola"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Este es tu espacio en The Chen: tu carnet, tus clases y tus reservas.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/classes/book">
            <CalendarPlus />
            Reservar clase
          </Link>
        </Button>
      </header>

      <div className="grid items-stretch gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {membership.data ? (
            <MembershipCard membership={membership.data} />
          ) : (
            <div className="bg-card/40 h-full rounded-xl border border-dashed p-4">
              {membership.error ? (
                <DataErrorNote message={membership.error} />
              ) : (
                <EmptyState
                  title="Aún no tienes membresía"
                  description="Pídele a recepción que registre tu plan para empezar a reservar."
                  icon={CreditCard}
                  action={
                    <Button asChild size="sm" variant="outline">
                      <Link href="/membership">Ver mi membresía</Link>
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </div>

        <Card className="flex flex-col lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
                <CalendarCheck className="size-3.5" aria-hidden />
              </span>
              Tu próxima clase
            </CardTitle>
            <CardDescription>La reserva activa más cercana.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/my-reservations">
                  Mis reservas
                  <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center gap-3">
            {reservations.error ? (
              <DataErrorNote message={reservations.error} />
            ) : null}

            {nextReservation ? (
              <div className="from-primary/10 via-card to-accent/30 flex flex-wrap items-center gap-4 rounded-xl border bg-linear-to-br p-4">
                <span className="bg-primary/10 text-primary flex size-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl leading-none">
                  <span className="text-[0.62rem] font-medium tracking-wide uppercase">
                    {formatWeekdayShort(nextReservation.date)}
                  </span>
                  <span className="font-heading text-2xl font-semibold tabular-nums">
                    {formatDayNumber(nextReservation.date)}
                  </span>
                  <span className="text-[0.62rem] tracking-wide uppercase">
                    {formatMonthShort(nextReservation.date)}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading truncate text-lg font-semibold">
                    {nextReservation.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm capitalize">
                    {formatLongDate(nextReservation.date)} ·{" "}
                    {nextReservation.startTime}
                  </p>
                </div>
                <StatusBadge
                  label={nextReservation.status}
                  tone={reservationTone(nextReservation.status)}
                />
              </div>
            ) : reservations.error ? null : (
              <EmptyState
                title="Aún no tienes clases reservadas"
                description="Cuando reserves una clase aparecerá aquí con su fecha y hora."
                icon={CalendarCheck}
                action={
                  <Button asChild size="sm">
                    <Link href="/classes/book">Buscar clases</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <DashboardPanel
        title="Clases de esta semana"
        description="Sesiones próximas con cupo disponible."
        icon={CalendarDays}
        action={{ label: "Ver todas", href: "/classes/book" }}
      >
        {sessions.error ? <DataErrorNote message={sessions.error} /> : null}

        {!sessions.error && featuredSessions.length === 0 ? (
          <EmptyState
            title="Todavía no hay clases con cupo"
            description="Cuando se publiquen nuevas sesiones aparecerán aquí."
            icon={CalendarDays}
          />
        ) : null}

        {featuredSessions.length > 0 ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {featuredSessions.map((session) => (
              <li
                key={session.id}
                className="bg-muted/40 hover:bg-muted/70 flex flex-wrap items-center gap-3 rounded-lg border p-2.5 transition-colors"
              >
                <DatePill iso={session.date} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{session.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {session.startTime} · {session.trainerName}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {session.availableSpots} libres
                  </span>
                  <ReserveButton
                    session={session}
                    freeSeats={session.availableSpots}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </DashboardPanel>

      <DashboardPanel
        title="Mis reservas"
        description="Las clases que ya apartaste."
        icon={Ticket}
        action={{ label: "Ver todas", href: "/my-reservations" }}
      >
        {reservations.error ? (
          <DataErrorNote message={reservations.error} />
        ) : null}

        {!reservations.error && nextReservations.length === 0 ? (
          <EmptyState
            title="No tienes reservas próximas"
            description="Aparta un cupo en alguna de las clases de esta semana."
            icon={Ticket}
            action={
              <Button asChild size="sm">
                <Link href="/classes/book">Reservar clase</Link>
              </Button>
            }
          />
        ) : null}

        {nextReservations.length > 0 ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {nextReservations.map((reservation) => (
              <li
                key={reservation.id}
                className="bg-muted/40 hover:bg-muted/70 flex items-center gap-3 rounded-lg border p-2.5 transition-colors"
              >
                <DatePill iso={reservation.date} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {reservation.name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs capitalize">
                    {formatLongDate(reservation.date)} · {reservation.startTime}
                  </p>
                </div>
                <StatusBadge
                  label={reservation.status}
                  tone={reservationTone(reservation.status)}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </DashboardPanel>
    </div>
  );
}
