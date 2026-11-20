import { CalendarClock, CreditCard, Layers } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  describeExpiry,
  formatClassesRemaining,
  formatDate,
} from "@/lib/format";
import { isMembershipActive, membershipTone } from "@/lib/status";
import type { Membership } from "@/lib/types/memberships";

export function MembershipSummary({ membership }: { membership: Membership }) {
  const active = isMembershipActive(membership.status);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {membership.planName}
            <StatusBadge label={membership.status} tone={membershipTone(membership.status)} />
          </CardTitle>
          <CardDescription>
            Vencimiento: {formatDate(membership.endDate)} ·{" "}
            {describeExpiry(membership.endDate)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <CreditCard className="text-muted-foreground mt-0.5 size-4" aria-hidden />
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Plan</span>
              <span className="text-sm font-medium">{membership.planName}</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CalendarClock className="text-muted-foreground mt-0.5 size-4" aria-hidden />
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Estado</span>
              <span className="text-sm font-medium">
                {active === null ? "Sin clasificar" : active ? "Vigente" : "No vigente"}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Layers className="text-muted-foreground mt-0.5 size-4" aria-hidden />
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">Clases restantes</span>
              <span className="text-sm font-medium">
                {formatClassesRemaining(membership.remainingClasses)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {active === false ? (
        <Alert variant="destructive">
          <AlertTitle>Tu membresía no está vigente</AlertTitle>
          <AlertDescription>
            Acércate a recepción para renovarla. Mientras no esté vigente no podrás
            reservar cupos ni agendar sesiones personales.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

export function MembershipPageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="Mi membresía"
        description="Consulta el plan, el estado, el vencimiento y las clases disponibles."
      />
      {children}
    </>
  );
}
