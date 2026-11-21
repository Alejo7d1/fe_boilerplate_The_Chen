"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { setPlanStatusAction } from "@/app/actions/plans";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PlanDialog } from "@/components/plans/plan-dialog";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatClassesRemaining, formatCurrency } from "@/lib/format";
import { planLabel, planTone } from "@/lib/status";
import type { MembershipPlan } from "@/lib/types/plans";

const ALL_PLANS = "all";
const ACTIVE_PLANS = "active";
const INACTIVE_PLANS = "inactive";

export function PlansTable({ plans }: { plans: MembershipPlan[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_PLANS);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return plans.filter((plan) => {
      const matchesName = !term || plan.name.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === ALL_PLANS ||
        (statusFilter === ACTIVE_PLANS && plan.active) ||
        (statusFilter === INACTIVE_PLANS && !plan.active);
      return matchesName && matchesStatus;
    });
  }, [plans, query, statusFilter]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(plan: MembershipPlan) {
    setEditing(plan);
    setDialogOpen(true);
  }

  async function handleActiveChange(plan: MembershipPlan, active: boolean) {
    if (active === plan.active) return;
    setPendingId(plan.id);
    const result = await setPlanStatusAction(plan.id, active);
    setPendingId(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(`«${plan.name}» quedó ${active ? "activo" : "inactivo"}.`);
    router.refresh();
  }

  const columns: DataTableColumn<MembershipPlan>[] = [
    {
      key: "name",
      header: "Plan",
      cell: (plan) => <span className="font-medium">{plan.name}</span>,
    },
    {
      key: "price",
      header: "Precio",
      cell: (plan) => formatCurrency(plan.price),
    },
    {
      key: "duration",
      header: "Duración",
      cell: (plan) => `${plan.durationDays} días`,
    },
    {
      key: "classes",
      header: "Clases",
      cell: (plan) => formatClassesRemaining(plan.classesIncluded),
    },
    {
      key: "active",
      header: "Estado",
      cell: (plan) => (
        <div className="flex items-center gap-2">
          <Badge variant={planTone(plan.active)}>{planLabel(plan.active)}</Badge>
          <Switch
            checked={plan.active}
            disabled={pendingId === plan.id}
            onCheckedChange={(value) => handleActiveChange(plan, value)}
            aria-label={
              plan.active ? `Desactivar ${plan.name}` : `Activar ${plan.name}`
            }
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      className: "w-12 text-right",
      headerClassName: "w-12",
      cell: (plan) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${plan.name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openEdit(plan)}>
              <Pencil />
              Editar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre"
          className="sm:max-w-xs"
          aria-label="Buscar planes por nombre"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-44" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PLANS}>Todos</SelectItem>
            <SelectItem value={ACTIVE_PLANS}>Activos</SelectItem>
            <SelectItem value={INACTIVE_PLANS}>Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Button className="sm:ml-auto" onClick={openCreate}>
          <Plus />
          Nuevo plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          title="Aún no hay planes"
          description="Crea el primer plan de membresía para poder registrar compras."
          action={<Button onClick={openCreate}>Nuevo plan</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(plan) => plan.id}
          emptyMessage="Ningún plan coincide con el filtro."
        />
      )}

      <PlanDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editing}
      />
    </div>
  );
}
