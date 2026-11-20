"use client";

import { useMemo, useState } from "react";
import { Settings2 } from "lucide-react";

import { EquipmentStatusDialog } from "@/components/equipment/equipment-status-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { equipmentTone } from "@/lib/status";
import type { Equipment } from "@/lib/types/equipment";

export function EquipmentAdminTable({ equipment }: { equipment: Equipment[] }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return equipment;
    return equipment.filter((item) =>
      `${item.name} ${item.category ?? ""}`.toLowerCase().includes(term)
    );
  }, [equipment, query]);

  function openDialog(item: Equipment) {
    setEditing(item);
    setOpen(true);
  }

  const columns: DataTableColumn<Equipment>[] = [
    {
      key: "name",
      header: "Máquina",
      cell: (item) => (
        <span className="flex flex-col">
          <span className="font-medium">{item.name}</span>
          {item.category ? (
            <span className="text-muted-foreground text-xs">{item.category}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (item) => <Badge variant={equipmentTone(item.status)}>{item.status}</Badge>,
    },
    {
      key: "reason",
      header: "Motivo vigente",
      cell: (item) => <span className="text-muted-foreground">{item.reason ?? "—"}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      className: "w-12 text-right",
      headerClassName: "w-12",
      cell: (item) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Cambiar estado de ${item.name}`}
          onClick={() => openDialog(item)}
        >
          <Settings2 />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nombre o categoría"
        className="sm:max-w-xs"
        aria-label="Buscar máquinas"
      />

      {equipment.length === 0 ? (
        <EmptyState
          title="Aún no hay máquinas"
          description="El inventario se administra desde el backend del gimnasio."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(item) => item.id}
          emptyMessage="Ninguna máquina coincide con la búsqueda."
        />
      )}

      {editing ? (
        <EquipmentStatusDialog
          key={editing.id}
          equipment={editing}
          open={open}
          onOpenChange={setOpen}
        />
      ) : null}
    </div>
  );
}
