import { describeExpiry, formatClassesRemaining, formatDate } from "@/lib/format";
import { isMembershipActive } from "@/lib/status";
import type { Membership } from "@/lib/types/memberships";

/**
 * Carnet de membresía del miembro: plan, estado, vencimiento y clases.
 * El texto usa `primary-foreground`, así que mantiene contraste tanto en
 * tema claro (texto claro sobre verde profundo) como oscuro (texto oscuro
 * sobre verde brillante).
 */
export function MembershipCard({ membership }: { membership: Membership }) {
  const active = isMembershipActive(membership.status);

  return (
    <div className="from-primary via-primary/95 to-info text-primary-foreground relative isolate flex h-full flex-col overflow-hidden rounded-2xl bg-linear-to-br p-5 shadow-sm">
      <div
        aria-hidden
        className="bg-primary-foreground/15 pointer-events-none absolute -top-16 -right-10 size-44 rounded-full blur-2xl"
      />
      <div
        aria-hidden
        className="border-primary-foreground/20 pointer-events-none absolute -right-12 -bottom-16 size-40 rounded-full border-[18px]"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-medium tracking-[0.14em] uppercase opacity-80">
            Mi membresía
          </p>
          <p className="font-heading mt-1 truncate text-2xl leading-tight font-semibold">
            {membership.planName}
          </p>
        </div>
        <span className="border-primary-foreground/25 bg-primary-foreground/15 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium">
          <span className="size-1.5 rounded-full bg-current" />
          {membership.status}
        </span>
      </div>

      <dl className="relative mt-6 grid grid-cols-2 gap-2.5 text-sm">
        <div className="bg-primary-foreground/10 rounded-xl p-3">
          <dt className="text-[0.6rem] tracking-wide uppercase opacity-75">
            Vence
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {formatDate(membership.endDate)}
          </dd>
          <dd className="mt-0.5 text-[11px] opacity-75">
            {describeExpiry(membership.endDate)}
          </dd>
        </div>
        <div className="bg-primary-foreground/10 rounded-xl p-3">
          <dt className="text-[0.6rem] tracking-wide uppercase opacity-75">
            Clases restantes
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {formatClassesRemaining(membership.remainingClasses)}
          </dd>
          <dd className="mt-0.5 text-[11px] opacity-75">
            {membership.remainingClasses === null
              ? "sin límite"
              : "disponibles"}
          </dd>
        </div>
      </dl>

      {active === false ? (
        <p className="bg-primary-foreground/15 relative mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed">
          Tu membresía no está vigente. Pasa por recepción para renovarla y
          volver a reservar.
        </p>
      ) : null}
    </div>
  );
}
