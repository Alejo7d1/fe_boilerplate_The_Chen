// lib/revenue.ts
// Agregaciones de la pantalla de ingresos. Solo combina lo que devuelven los
// endpoints existentes (`/api/reports/financial`, `/api/charges/pending`,
// `/api/reports/occupancy`, `/api/plans`, `/api/users`); no inventa datos.

import { isoToDate } from "@/lib/date-range";
import type { MembershipPlan } from "@/lib/types/plans";
import type { PendingCharge } from "@/lib/types/payments";
import type { OccupancyReportRow } from "@/lib/types/reports";

export interface AmountBreakdown {
  key: string;
  label: string;
  hint?: string;
  amount: number;
  count: number;
}

export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
}

export interface PendingSummary {
  chargeCount: number;
  totalAmount: number;
  averageAmount: number;
  memberCount: number;
  lastIssuedDate?: string;
  byMember: AmountBreakdown[];
  byConcept: AmountBreakdown[];
  aging: AgingBucket[];
}

const AGING_STEPS = [
  { label: "Hasta 7 días", maxDays: 7 },
  { label: "8 a 15 días", maxDays: 15 },
  { label: "16 a 30 días", maxDays: 30 },
  { label: "Más de 30 días", maxDays: Number.POSITIVE_INFINITY },
] as const;

const NO_DATE_LABEL = "Sin fecha";

function daysBetween(fromIso: string, toIso: string): number {
  const from = isoToDate(fromIso).getTime();
  const to = isoToDate(toIso).getTime();
  return Math.round((to - from) / 86_400_000);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Resumen de la cartera pendiente: total, concentración y antigüedad. */
export function summarizePendingCharges(
  charges: readonly PendingCharge[],
  today: string
): PendingSummary {
  const totalAmount = round2(
    charges.reduce((sum, charge) => sum + charge.amount, 0)
  );
  const members = new Map<string, AmountBreakdown>();
  const concepts = new Map<string, AmountBreakdown>();
  const aging: AgingBucket[] = AGING_STEPS.map((step) => ({
    label: step.label,
    amount: 0,
    count: 0,
  }));
  let undatedAmount = 0;
  let undatedCount = 0;

  for (const charge of charges) {
    const memberKey = charge.memberId ?? charge.memberName ?? charge.id;
    const member = members.get(memberKey) ?? {
      key: memberKey,
      label: charge.memberName ?? "Miembro sin nombre",
      hint: charge.memberCardNumber,
      amount: 0,
      count: 0,
    };
    member.amount = round2(member.amount + charge.amount);
    member.count += 1;
    members.set(memberKey, member);

    const conceptKey = charge.concept ?? "Sin concepto";
    const concept = concepts.get(conceptKey) ?? {
      key: conceptKey,
      label: conceptKey,
      amount: 0,
      count: 0,
    };
    concept.amount = round2(concept.amount + charge.amount);
    concept.count += 1;
    concepts.set(conceptKey, concept);

    if (!charge.dueDate) {
      undatedAmount = round2(undatedAmount + charge.amount);
      undatedCount += 1;
      continue;
    }

    const age = Math.max(0, daysBetween(charge.dueDate, today));
    const index = AGING_STEPS.findIndex((step) => age <= step.maxDays);
    const bucket = aging[index] ?? aging[aging.length - 1];
    bucket.amount = round2(bucket.amount + charge.amount);
    bucket.count += 1;
  }

  if (undatedCount > 0) {
    aging.push({
      label: NO_DATE_LABEL,
      amount: undatedAmount,
      count: undatedCount,
    });
  }

  const byAmount = (a: AmountBreakdown, b: AmountBreakdown) => b.amount - a.amount;
  const issued = charges
    .map((charge) => charge.dueDate)
    .filter((date): date is string => Boolean(date))
    .sort();

  return {
    chargeCount: charges.length,
    totalAmount,
    averageAmount: charges.length > 0 ? round2(totalAmount / charges.length) : 0,
    memberCount: members.size,
    lastIssuedDate: issued[issued.length - 1],
    byMember: [...members.values()].sort(byAmount),
    byConcept: [...concepts.values()].sort(byAmount),
    aging,
  };
}

export interface PlanInsight {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  classesIncluded: number | null;
  active: boolean;
  /** Precio llevado a 30 días para comparar planes de distinta duración. */
  monthlyEquivalent: number;
}

export interface PlanSummary {
  active: PlanInsight[];
  inactiveCount: number;
  averageMonthly: number;
}

export function summarizePlans(plans: readonly MembershipPlan[]): PlanSummary {
  const insights: PlanInsight[] = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    durationDays: plan.durationDays,
    classesIncluded: plan.classesIncluded,
    active: plan.active,
    monthlyEquivalent:
      plan.durationDays > 0
        ? round2(plan.price / (plan.durationDays / 30))
        : plan.price,
  }));

  const active = insights
    .filter((plan) => plan.active)
    .sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);

  return {
    active,
    inactiveCount: insights.filter((plan) => !plan.active).length,
    averageMonthly:
      active.length > 0
        ? round2(
            active.reduce((sum, plan) => sum + plan.monthlyEquivalent, 0) /
              active.length
          )
        : 0,
  };
}

export interface ActivitySummary {
  sessions: number;
  capacity: number;
  reserved: number;
  occupancyRate: number;
}

/** Actividad de clases del periodo, para relacionar ingresos con uso del club. */
export function summarizeOccupancy(
  rows: readonly OccupancyReportRow[]
): ActivitySummary {
  const capacity = rows.reduce((sum, row) => sum + (row.maxCapacity ?? 0), 0);
  const reserved = rows.reduce((sum, row) => sum + (row.reservedCount ?? 0), 0);

  return {
    sessions: rows.length,
    capacity,
    reserved,
    occupancyRate: capacity > 0 ? round2((reserved / capacity) * 100) : 0,
  };
}

/** Parte entregada (`part`) sobre el total, en escala 0–100. */
export function sharePercent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (part / total) * 100));
}
