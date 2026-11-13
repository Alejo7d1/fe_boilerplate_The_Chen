"use client";

import { useMemo, useState } from "react";
import { CalendarX, MoreHorizontal, Pencil, Plus } from "lucide-react";

import { CancelClassDialog } from "@/components/classes/cancel-class-dialog";
import { ClassDialog } from "@/components/classes/class-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
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
import { formatDate, formatDuration } from "@/lib/format";
import { classTone } from "@/lib/status";
import type { ClassSession } from "@/lib/types/classes";
import type { TrainerSummary } from "@/lib/types/trainers";

const ALL_TRAINERS = "__all__";

export interface AdminClassesTableProps {
  sessions: ClassSession[];
  trainers: TrainerSummary[];
}

export function AdminClassesTable({ sessions, trainers }: AdminClassesTableProps) {
  const [dateFilter, setDateFilter] = useState("");
  const [trainerFilter, setTrainerFilter] = useState(ALL_TRAINERS);
  const [query, setQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassSession | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState<ClassSession | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sessions
      .filter((session) => {
        const matchesDate = !dateFilter || session.date === dateFilter;
        const matchesTrainer =
          trainerFilter === ALL_TRAINERS || session.trainerId === trainerFilter;
        const matchesTerm = !term || session.name.toLowerCase().includes(term);
        return matchesDate && matchesTrainer && matchesTerm;
      })
      .sort((a, b) =>
        `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)
      );
  }, [sessions, dateFilter, trainerFilter, query]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(session: ClassSession) {
    setEditing(session);
    setFormOpen(true);
  }

  function openCancel(session: ClassSession) {
    setCancelling(session);
    setCancelOpen(true);
  }

  const columns: DataTableColumn<ClassSession>[] = [
    {
      key: "name",
      header: "Clase",
      cell: (session) => <span className="font-medium">{session.name}</span>,
    },
    {
      key: "trainer",
      header: "Entrenador",
      cell: (session) => session.trainerName,
    },
    {
      key: "schedule",
      header: "Fecha y hora",
      cell: (session) => `${formatDate(session.date)} · ${session.startTime}`,
    },
    {
      key: "duration",
      header: "Duración",
      cell: (session) => formatDuration(session.durationMinutes),
    },
    {
      key: "capacity",
      header: "Cupos",
      cell: (session) =>
        `${session.maxCapacity - session.availableSpots}/${session.maxCapacity}`,
    },
    {
      key: "status",
      header: "Estado",
      cell: (session) => (
        <Badge variant={classTone(session.status)}>{session.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      className: "w-12 text-right",
      headerClassName: "w-12",
      cell: (session) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Acciones de ${session.name}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openEdit(session)}>
              <Pencil />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={session.status !== "Programada"}
              onSelect={() => openCancel(session)}
            >
              <CalendarX />
              Cancelar clase
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="lg:w-44"
          aria-label="Filtrar por fecha"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre"
          className="lg:max-w-xs"
          aria-label="Buscar clases por nombre"
        />
        {trainers.length > 1 ? (
          <Select value={trainerFilter} onValueChange={setTrainerFilter}>
            <SelectTrigger className="lg:w-52" aria-label="Filtrar por entrenador">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TRAINERS}>Todos los entrenadores</SelectItem>
              {trainers.map((trainer) => (
                <SelectItem key={trainer.id} value={trainer.id}>
                  {trainer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button className="lg:ml-auto" onClick={openCreate} disabled={trainers.length === 0}>
          <Plus />
          Nueva clase
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="Aún no hay clases"
          description="Programa la primera clase indicando entrenador, fecha y cupo."
          action={
            <Button onClick={openCreate} disabled={trainers.length === 0}>
              Nueva clase
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(session) => session.id}
          emptyMessage="Ninguna clase coincide con los filtros."
        />
      )}

      <ClassDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        session={editing}
        trainers={trainers}
      />
      <CancelClassDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        session={cancelling}
      />
    </div>
  );
}
