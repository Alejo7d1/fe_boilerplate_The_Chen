"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IsoDate } from "@/lib/types/common";
import type { TrainerSummary } from "@/lib/types/trainers";

const ALL = "__all__";

const REPORTS_PATH = "/admin/reports/reviews";

export interface ReviewAnalyticsClassOption {
  id: string;
  name: string;
}

export interface ReviewAnalyticsFiltersProps {
  startDate: IsoDate;
  endDate: IsoDate;
  trainerId?: string;
  classId?: string;
  trainers: TrainerSummary[];
  classes: ReviewAnalyticsClassOption[];
}

/** H17 · Filtros del reporte; navega con los parámetros del contrato. */
export function ReviewAnalyticsFilters({
  startDate,
  endDate,
  trainerId,
  classId,
  trainers,
  classes,
}: ReviewAnalyticsFiltersProps) {
  const router = useRouter();
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [trainer, setTrainer] = useState(trainerId ?? ALL);
  const [session, setSession] = useState(classId ?? ALL);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!start || !end) {
      setError("Indica la fecha inicial y la final.");
      return;
    }
    if (start > end) {
      setError("La fecha inicial no puede ser posterior a la final.");
      return;
    }

    setError(null);
    const params = new URLSearchParams({ startDate: start, endDate: end });
    if (trainer !== ALL) params.set("trainerId", trainer);
    if (session !== ALL) params.set("classId", session);
    router.push(`${REPORTS_PATH}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <FieldGroup className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <Field className="lg:w-44">
          <FieldLabel htmlFor="reviews-start">Desde</FieldLabel>
          <Input
            id="reviews-start"
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </Field>

        <Field className="lg:w-44">
          <FieldLabel htmlFor="reviews-end">Hasta</FieldLabel>
          <Input
            id="reviews-end"
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </Field>

        <Field className="lg:w-56">
          <FieldLabel htmlFor="reviews-trainer">Entrenador</FieldLabel>
          <Select value={trainer} onValueChange={setTrainer}>
            <SelectTrigger id="reviews-trainer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los entrenadores</SelectItem>
              {trainers.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field className="lg:w-56">
          <FieldLabel htmlFor="reviews-class">Clase</FieldLabel>
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger id="reviews-class">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas las clases</SelectItem>
              {classes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Button type="submit" className="lg:mb-0.5">
          <Search />
          Aplicar filtros
        </Button>
      </FieldGroup>

      <FieldError errors={error ? [{ message: error }] : undefined} />
    </form>
  );
}
