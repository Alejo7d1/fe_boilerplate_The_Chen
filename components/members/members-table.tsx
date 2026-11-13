"use client";

import { useMemo, useState } from "react";
import { Plus, UserPlus } from "lucide-react";

import { MemberDialog } from "@/components/members/member-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MemberSummary } from "@/lib/types/members";

export function MembersTable({ members }: { members: MemberSummary[] }) {
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) =>
      [member.name, member.email, member.cardNumber]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [members, query]);

  const columns: DataTableColumn<MemberSummary>[] = [
    {
      key: "name",
      header: "Miembro",
      cell: (member) => <span className="font-medium">{member.name || "Sin nombre"}</span>,
    },
    {
      key: "email",
      header: "Correo",
      cell: (member) => member.email ?? "—",
    },
    {
      key: "card",
      header: "Carné",
      cell: (member) => (
        <span className="font-mono text-xs">{member.cardNumber ?? "—"}</span>
      ),
    },
    {
      key: "role",
      header: "Rol",
      cell: (member) => <Badge variant="outline">{member.role ?? "MIEMBRO"}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, correo o carné"
          className="sm:max-w-sm"
          aria-label="Buscar miembros"
        />
        <Button className="sm:ml-auto" onClick={() => setDialogOpen(true)}>
          <Plus />
          Nuevo miembro
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState
          title="Aún no hay miembros"
          description="Registra el primer miembro para poder asignarle una membresía."
          icon={UserPlus}
          action={<Button onClick={() => setDialogOpen(true)}>Nuevo miembro</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(member) => member.id}
          emptyMessage="Ningún miembro coincide con la búsqueda."
        />
      )}

      <MemberDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
