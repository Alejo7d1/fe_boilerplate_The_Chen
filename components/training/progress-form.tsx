"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarIcon, CircleAlert, CircleCheck, Plus, Ruler, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { recordProgressAction } from "@/app/actions/training";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { dateToIso, isoToLocalDate } from "@/lib/date-range";
import { formatDate } from "@/lib/format";
import { parseMetric } from "@/lib/training-rules";
import type { IsoDate } from "@/lib/types/common";
import {
  PROGRESS_LIMITS,
  STRENGTH_MARK_MAX,
  type ProgressEntry,
} from "@/lib/types/training";

export interface ProgressFormProps {
  today: IsoDate;
}

interface MarkRow {
  key: string;
  value: string;
}

const NO_MARKS: MarkRow[] = [];

/** H13 · Registro de medidas con validación en vivo y confirmación del alta. */
export function ProgressForm({ today }: ProgressFormProps) {
  const [date, setDate] = useState<IsoDate>(today);
  const [dateOpen, setDateOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [marks, setMarks] = useState<MarkRow[]>(NO_MARKS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [entry, setEntry] = useState<ProgressEntry | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setFormError(null);
    setErrors({});

    startTransition(async () => {
      const result = await recordProgressAction({
        date,
        weight,
        waist,
        chest,
        strengthMarks: marks.map((mark) => mark.value),
      });

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message ?? "No pudimos registrar tus medidas.");
        return;
      }

      toast.success("Medición registrada.");
      setEntry(result.entry ?? null);
      setWeight("");
      setWaist("");
      setChest("");
      setMarks(NO_MARKS);
      setDate(today);
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {entry ? (
        <Alert>
          <CircleCheck />
          <AlertTitle>Medición registrada</AlertTitle>
          <AlertDescription className="flex flex-col gap-1">
            <span>
              {formatDate(entry.date)} · {entry.weight} kg · cintura {entry.waist} cm ·
              pecho {entry.chest} cm
            </span>
            <Button asChild variant="link" size="sm" className="h-auto w-fit px-0">
              <Link href="/progress">Ver mi progreso</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="size-5" aria-hidden />
            Nueva medición
          </CardTitle>
          <CardDescription>
            Peso entre {PROGRESS_LIMITS.weight.min} y {PROGRESS_LIMITS.weight.max} kg;
            cintura y pecho entre {PROGRESS_LIMITS.waist.min} y{" "}
            {PROGRESS_LIMITS.chest.max} cm. La fecha no puede ser futura.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {formError ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>No se pudo registrar la medición</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="progress-date">Fecha de la medición</FieldLabel>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="progress-date"
                    type="button"
                    variant="outline"
                    className="w-full justify-start sm:w-64"
                  >
                    <CalendarIcon />
                    {formatDate(date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={isoToLocalDate(date)}
                    onSelect={(value) => {
                      if (!value) return;
                      setDate(dateToIso(value));
                      setDateOpen(false);
                    }}
                    disabled={{ after: isoToLocalDate(today) }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <FieldError
                errors={errors.date ? [{ message: errors.date }] : undefined}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="progress-weight">Peso (kg)</FieldLabel>
                <Input
                  id="progress-weight"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  inputMode="decimal"
                  placeholder="78.5"
                  disabled={pending}
                  aria-invalid={Boolean(errors.weight)}
                />
                <FieldError
                  errors={errors.weight ? [{ message: errors.weight }] : undefined}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="progress-waist">Cintura (cm)</FieldLabel>
                <Input
                  id="progress-waist"
                  value={waist}
                  onChange={(event) => setWaist(event.target.value)}
                  inputMode="decimal"
                  placeholder="84"
                  disabled={pending}
                  aria-invalid={Boolean(errors.waist)}
                />
                <FieldError
                  errors={errors.waist ? [{ message: errors.waist }] : undefined}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="progress-chest">Pecho (cm)</FieldLabel>
                <Input
                  id="progress-chest"
                  value={chest}
                  onChange={(event) => setChest(event.target.value)}
                  inputMode="decimal"
                  placeholder="102"
                  disabled={pending}
                  aria-invalid={Boolean(errors.chest)}
                />
                <FieldError
                  errors={errors.chest ? [{ message: errors.chest }] : undefined}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="progress-mark-0">
                Marcas de fuerza (opcional)
              </FieldLabel>
              <div className="flex flex-col gap-2">
                {marks.map((mark, index) => (
                  <div key={mark.key} className="flex items-center gap-2">
                    <Input
                      id={index === 0 ? "progress-mark-0" : undefined}
                      value={mark.value}
                      onChange={(event) =>
                        setMarks((current) =>
                          current.map((item) =>
                            item.key === mark.key
                              ? { ...item, value: event.target.value }
                              : item
                          )
                        )
                      }
                      maxLength={STRENGTH_MARK_MAX}
                      placeholder="Press banca 80 kg"
                      disabled={pending}
                      aria-label={`Marca de fuerza ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Quitar marca ${index + 1}`}
                      onClick={() =>
                        setMarks((current) =>
                          current.filter((item) => item.key !== mark.key)
                        )
                      }
                      disabled={pending}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() =>
                    setMarks((current) => [
                      ...current,
                      { key: crypto.randomUUID(), value: "" },
                    ])
                  }
                  disabled={pending}
                >
                  <Plus />
                  Agregar marca
                </Button>
              </div>
              <FieldError
                errors={
                  errors.strengthMarks ? [{ message: errors.strengthMarks }] : undefined
                }
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={pending || !canSubmit(weight, waist, chest)}
            >
              {pending ? <Spinner aria-label="Guardando medición" /> : <CircleCheck />}
              Guardar medición
            </Button>
            <Button asChild variant="ghost">
              <Link href="/progress">Ver mi progreso</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Solo habilita el envío cuando hay tres números capturados. */
function canSubmit(weight: string, waist: string, chest: string): boolean {
  return [weight, waist, chest].every((value) => Number.isFinite(parseMetric(value)));
}
