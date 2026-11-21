// components/reports/revenue-dashboard.tsx
// Panel de ingresos: cifras del periodo financiero más la cartera pendiente,
// los planes y la actividad de clases. Todo sale de endpoints existentes.

import {
  Activity,
  CircleAlert,
  Clock,
  CreditCard,
  DollarSign,
  Repeat2,
  Target,
  Users,
  Wallet,
} from "lucide-react";

import { DataErrorNote } from "@/components/dashboard/data-error-note";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  BarList,
  CHART_COLORS,
  ColumnChart,
  DonutChart,
  Meter,
  StackedBar,
} from "@/components/reports/reports-charts";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatClassesRemaining, formatCount, formatCurrency, formatDate, formatPercent } from "@/lib/format";
import type { SettledData } from "@/lib/dashboard";
import {
  sharePercent,
  summarizeOccupancy,
  summarizePendingCharges,
  summarizePlans,
} from "@/lib/revenue";
import type { MemberSummary } from "@/lib/types/members";
import type { PendingCharge } from "@/lib/types/payments";
import type { MembershipPlan } from "@/lib/types/plans";
import type { FinancialReport, OccupancyReportRow } from "@/lib/types/reports";

const TOP_DEBTORS = 6;
const TOP_CONCEPTS = 5;

export interface RevenueDashboardProps {
  financial: SettledData<FinancialReport>;
  pending: SettledData<PendingCharge[]>;
  plans: SettledData<MembershipPlan[]>;
  activity: SettledData<OccupancyReportRow[]>;
  members: SettledData<MemberSummary[]>;
  today: string;
}

function money(value: number | undefined): string {
  return value === undefined ? "—" : formatCurrency(value);
}

/** Estima el pago promedio; `undefined` cuando falta el conteo o el total. */
function averageTicket(
  total: number | undefined,
  count: number | undefined
): number | undefined {
  if (total === undefined || count === undefined || count <= 0) return undefined;
  return total / count;
}

export function RevenueDashboard({
  financial,
  pending,
  plans,
  activity,
  members,
  today,
}: RevenueDashboardProps) {
  const report = financial.data;
  const revenue = report?.totalRevenue;
  const paymentCount = report?.paymentCount;
  const renewals = report?.renewals;
  const renewalRate = report?.renewalRate;
  const newPayments =
    paymentCount !== undefined && renewals !== undefined
      ? Math.max(0, paymentCount - renewals)
      : undefined;

  const pendingSummary = pending.data
    ? summarizePendingCharges(pending.data, today)
    : null;
  const planSummary = plans.data ? summarizePlans(plans.data) : null;
  const activitySummary = activity.data
    ? summarizeOccupancy(activity.data)
    : null;

  const ticket = averageTicket(revenue, paymentCount);
  const pipeline =
    revenue !== undefined && pendingSummary
      ? revenue + pendingSummary.totalAmount
      : undefined;
  const collectionRate =
    pipeline !== undefined && pipeline > 0 && revenue !== undefined
      ? sharePercent(revenue, pipeline)
      : undefined;
  const revenuePerMember =
    revenue !== undefined && members.data && members.data.length > 0
      ? revenue / members.data.length
      : undefined;

  if (!report) {
    return financial.error ? (
      <DataErrorNote message={financial.error} />
    ) : (
      <EmptyState
        title="Sin datos en el periodo"
        description="El backend no devolvió cifras para el rango elegido."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {financial.error ? <DataErrorNote message={financial.error} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Ingresos del periodo"
          value={money(revenue)}
          hint={report.period ? `Periodo ${report.period}` : "Cobros pagados"}
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Pagos registrados"
          value={paymentCount === undefined ? "—" : formatCount(paymentCount)}
          hint={
            ticket === undefined ? "Ticket sin datos" : `Ticket medio ${formatCurrency(ticket)}`
          }
          icon={CreditCard}
          tone="info"
        />
        <StatCard
          label="Renovaciones"
          value={renewals === undefined ? "—" : formatCount(renewals)}
          hint={
            newPayments === undefined
              ? "Sin desglose"
              : `${formatCount(newPayments)} pagos nuevos`
          }
          icon={Repeat2}
          tone="primary"
        />
        <StatCard
          label="Tasa de renovación"
          value={renewalRate === undefined ? "—" : formatPercent(renewalRate)}
          hint="Renovaciones sobre pagos"
          icon={Target}
          tone="accent"
        />
        <StatCard
          label="Cartera pendiente"
          value={
            pendingSummary ? formatCurrency(pendingSummary.totalAmount) : "—"
          }
          hint={
            pendingSummary
              ? `${formatCount(pendingSummary.chargeCount)} cobros · ${formatCount(
                  pendingSummary.memberCount
                )} miembros`
              : (pending.error ?? "Sin datos")
          }
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Ingreso por miembro"
          value={money(revenuePerMember)}
          hint={
            members.data
              ? `${formatCount(members.data.length)} miembros registrados`
              : (members.error ?? "Sin padrón")
          }
          icon={Users}
          tone="muted"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardPanel
          title="Cobrado vs. pendiente"
          description="Qué parte de la facturación del periodo ya entró a caja."
          icon={Wallet}
          className="lg:col-span-2"
        >
          {pending.error ? <DataErrorNote message={pending.error} /> : null}
          {revenue === undefined && !pendingSummary ? (
            <p className="text-muted-foreground text-sm">
              El backend no informó ingresos ni cobros pendientes.
            </p>
          ) : (
            <>
              <DonutChart
                segments={[
                  {
                    label: "Cobrado",
                    value: revenue ?? 0,
                    color: CHART_COLORS.revenue,
                  },
                  {
                    label: "Pendiente",
                    value: pendingSummary?.totalAmount ?? 0,
                    color: CHART_COLORS.pending,
                  },
                ]}
                centerValue={
                  collectionRate === undefined ? "—" : formatPercent(collectionRate, 0)
                }
                centerLabel="cobrado"
                formatValue={formatCurrency}
              />
              <Meter
                value={collectionRate ?? 0}
                caption={
                  pipeline === undefined
                    ? "Sin total facturado"
                    : `Facturado ${formatCurrency(pipeline)} · ${formatPercent(
                        collectionRate ?? 0,
                        0
                      )} cobrado`
                }
              />
            </>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Composición de los pagos"
          description="Renovaciones frente a cobros nuevos del periodo."
          icon={Repeat2}
          className="lg:col-span-3"
        >
          {paymentCount === undefined ? (
            <p className="text-muted-foreground text-sm">
              El backend no informó la cantidad de pagos.
            </p>
          ) : (
            <>
              <StackedBar
                segments={[
                  {
                    label: "Renovaciones",
                    value: renewals ?? 0,
                    color: CHART_COLORS.accent,
                  },
                  {
                    label: "Pagos nuevos",
                    value: newPayments ?? 0,
                    color: CHART_COLORS.info,
                  },
                ]}
                formatValue={formatCount}
              />
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Metric label="Pagos" value={formatCount(paymentCount)} />
                <Metric
                  label="Renovaciones"
                  value={renewals === undefined ? "—" : formatCount(renewals)}
                />
                <Metric
                  label="Nuevos"
                  value={newPayments === undefined ? "—" : formatCount(newPayments)}
                />
                <Metric
                  label="Ticket medio"
                  value={ticket === undefined ? "—" : formatCurrency(ticket)}
                />
              </dl>
            </>
          )}
        </DashboardPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardPanel
          title="Antigüedad de la cartera"
          description="Cobros pendientes según los días transcurridos desde su emisión."
          icon={Clock}
          className="lg:col-span-3"
        >
          {pending.error ? <DataErrorNote message={pending.error} /> : null}
          {pendingSummary ? (
            <>
              <ColumnChart
                data={pendingSummary.aging.map((bucket) => ({
                  label: bucket.label,
                  value: bucket.amount,
                  hint: `${formatCount(bucket.count)} cobros`,
                }))}
                formatValue={formatCurrency}
              />
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Metric
                  label="Cobros pendientes"
                  value={formatCount(pendingSummary.chargeCount)}
                />
                <Metric
                  label="Promedio por cobro"
                  value={formatCurrency(pendingSummary.averageAmount)}
                />
                <Metric
                  label="Más reciente"
                  value={
                    pendingSummary.lastIssuedDate
                      ? formatDate(pendingSummary.lastIssuedDate)
                      : "—"
                  }
                />
              </dl>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Sin cobros pendientes.</p>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Actividad del periodo"
          description="Clases y cupos reservados: el pulso que sostiene los ingresos."
          icon={Activity}
          className="lg:col-span-2"
        >
          {activity.error ? <DataErrorNote message={activity.error} /> : null}
          {activitySummary ? (
            <>
              <Meter
                value={activitySummary.occupancyRate}
                caption={`Ocupación media ${formatPercent(activitySummary.occupancyRate)}`}
              />
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Metric label="Clases" value={formatCount(activitySummary.sessions)} />
                <Metric
                  label="Cupos"
                  value={formatCount(activitySummary.capacity)}
                />
                <Metric
                  label="Reservados"
                  value={formatCount(activitySummary.reserved)}
                />
              </dl>
              <p className="text-muted-foreground text-xs">
                {activitySummary.capacity > 0
                  ? `${formatCount(
                      Math.max(0, activitySummary.capacity - activitySummary.reserved)
                    )} cupos quedaron libres en el periodo.`
                  : "No hay clases programadas en el rango."}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Sin actividad registrada.</p>
          )}
        </DashboardPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardPanel
          title="Miembros con mayor saldo"
          description="Concentración de la cartera pendiente por miembro."
          icon={Users}
          action={{ label: "Cobros pendientes", href: "/admin/pending-charges" }}
          className="lg:col-span-3"
        >
          {pending.error ? <DataErrorNote message={pending.error} /> : null}
          {pendingSummary && pendingSummary.byMember.length > 0 ? (
            <>
              <BarList
                data={pendingSummary.byMember
                  .slice(0, TOP_DEBTORS)
                  .map((row) => ({
                    label: row.label,
                    value: row.amount,
                    hint: `${formatCount(row.count)} cobros`,
                  }))}
                formatValue={formatCurrency}
              />
              {pendingSummary.byMember.length > TOP_DEBTORS ? (
                <p className="text-muted-foreground text-xs">
                  y {formatCount(pendingSummary.byMember.length - TOP_DEBTORS)} miembros
                  más con saldo.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nadie tiene cobros pendientes.
            </p>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Cobros por concepto"
          description="Qué genera la deuda pendiente."
          icon={CircleAlert}
          className="lg:col-span-2"
        >
          {pending.error ? <DataErrorNote message={pending.error} /> : null}
          {pendingSummary && pendingSummary.byConcept.length > 0 ? (
            <BarList
              data={pendingSummary.byConcept.slice(0, TOP_CONCEPTS).map((row) => ({
                label: row.label,
                value: row.amount,
                hint: `${formatCount(row.count)}`,
              }))}
              formatValue={formatCurrency}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Sin conceptos pendientes.</p>
          )}
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Planes vigentes"
        description="Precio llevado a 30 días para comparar planes de distinta duración."
        icon={CreditCard}
        action={{ label: "Gestionar planes", href: "/admin/plans" }}
      >
        {plans.error ? <DataErrorNote message={plans.error} /> : null}
        {planSummary && planSummary.active.length > 0 ? (
          <>
            <BarList
              data={planSummary.active.map((plan) => ({
                label: plan.name,
                value: plan.monthlyEquivalent,
                hint: `${formatCurrency(plan.price)} · ${plan.durationDays} días`,
              }))}
              formatValue={(value) => `${formatCurrency(value)}/mes`}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">
                {formatCount(planSummary.active.length)} activos
              </Badge>
              <Badge variant="outline">
                {formatCount(planSummary.inactiveCount)} inactivos
              </Badge>
              <span className="text-muted-foreground">
                Equivalente mensual medio {formatCurrency(planSummary.averageMonthly)}.
              </span>
            </div>
            <p className="text-muted-foreground text-xs">
              Clases incluidas:{" "}
              {planSummary.active
                .map(
                  (plan) =>
                    `${plan.name} ${formatClassesRemaining(plan.classesIncluded)}`
                )
                .join(" · ")}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No hay planes activos para comparar.
          </p>
        )}
      </DashboardPanel>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-[0.65rem] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
