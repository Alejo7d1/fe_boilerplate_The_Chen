"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { CircleAlert } from "lucide-react";

import { listEquipmentAction } from "@/app/actions/equipment";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { equipmentTone } from "@/lib/status";
import { EQUIPMENT_STATUSES, type Equipment } from "@/lib/types/equipment";

const ALL_STATUSES = "__all__";
const REFRESH_MS = 60_000;

export interface EquipmentGridProps {
  initialEquipment: Equipment[];
  initialError: string | null;
}

/**
 * H15 · Consulta de disponibilidad.
 * El primer render usa los datos del servidor; después el filtro y el refresco
 * periódico (60 s + al volver a la ventana) se resuelven con la Server Action.
 */
export function EquipmentGrid({ initialEquipment, initialError }: EquipmentGridProps) {
  const [equipment, setEquipment] = useState(initialEquipment);
  const [status, setStatus] = useState(ALL_STATUSES);
  const [error, setError] = useState<string | null>(initialError);
  const [refreshing, startTransition] = useTransition();
  const mounted = useRef(false);

  const load = useCallback((nextStatus: string) => {
    startTransition(async () => {
      const result = await listEquipmentAction(
        nextStatus === ALL_STATUSES ? undefined : nextStatus
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setError(null);
      setEquipment(result.equipment);
    });
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    load(status);
  }, [status, load]);

  useEffect(() => {
    if (!mounted.current) return;
    const interval = setInterval(() => load(status), REFRESH_MS);
    const onFocus = () => load(status);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [status, load]);

  const sorted = [...equipment].sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-56" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>Todos los estados</SelectItem>
            {EQUIPMENT_STATUSES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {refreshing ? (
          <span className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner aria-label="Actualizando equipos" />
            Actualizando…
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            Se actualiza automáticamente cada minuto.
          </span>
        )}
      </div>

      {error ? (
        <p className="text-destructive flex items-start gap-2 text-sm" role="alert">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <EmptyState
          title="No se encontraron equipos en esta categoría"
          description="Prueba con otro estado o vuelve a consultar en un momento."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((item) => (
            <li key={item.id}>
              <Card className="h-full">
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  {item.category ? (
                    <p className="text-muted-foreground text-xs">{item.category}</p>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Badge variant={equipmentTone(item.status)} className="w-fit">
                    {item.status}
                  </Badge>
                  {item.reason ? (
                    <p className="text-muted-foreground text-sm">{item.reason}</p>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
