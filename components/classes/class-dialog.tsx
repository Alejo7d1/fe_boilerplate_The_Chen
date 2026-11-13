"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { saveClassAction } from "@/app/actions/classes";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { IDLE_FORM_STATE, type FormState } from "@/lib/actions/form-state";
import { dateToIso, isoToLocalDate, todayIso } from "@/lib/date-range";
import { formatDate } from "@/lib/format";
import type { ClassSession } from "@/lib/types/classes";
import type { TrainerSummary } from "@/lib/types/trainers";

/** Horario de operación del club: 06:00 a 21:00 en bloques de 30 minutos. */
const TIME_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120];

export interface ClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` crea una clase nueva. */
  session: ClassSession | null;
  trainers: TrainerSummary[];
}

export function ClassDialog({ open, onOpenChange, session, trainers }: ClassDialogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveClassAction, IDLE_FORM_STATE);
  const handled = useRef<FormState | null>(null);

  const [date, setDate] = useState(session?.date ?? todayIso());
  const [dateOpen, setDateOpen] = useState(false);
  const [startTime, setStartTime] = useState(session?.startTime ?? "06:00");
  const [duration, setDuration] = useState(String(session?.durationMinutes ?? 60));
  const [trainerId, setTrainerId] = useState(
    session?.trainerId ?? trainers[0]?.id ?? ""
  );

  useEffect(() => {
    if (!state.success || handled.current === state) return;
    handled.current = state;
    toast.success(session ? "Clase actualizada." : "Clase programada.");
    onOpenChange(false);
    router.refresh();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{session ? "Editar clase" : "Nueva clase"}</DialogTitle>
          <DialogDescription>
            Define entrenador, fecha, hora y cupo máximo de la sesión.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-5">
          {session ? <input type="hidden" name="id" value={session.id} /> : null}
          <input type="hidden" name="trainerId" value={trainerId} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="startTime" value={startTime} />
          <input type="hidden" name="durationMinutes" value={duration} />

          {state.error ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>No se pudo guardar</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          {trainers.length === 0 ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>Sin entrenadores</AlertTitle>
              <AlertDescription>
                No hay entrenadores disponibles para asignar la clase.
              </AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="class-name">Nombre de la clase</FieldLabel>
              <Input
                id="class-name"
                name="name"
                defaultValue={session?.name}
                placeholder="Spinning"
                maxLength={60}
                required
              />
              <FieldError
                errors={
                  state.fieldErrors?.name ? [{ message: state.fieldErrors.name }] : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="class-trainer">Entrenador</FieldLabel>
              <Select value={trainerId} onValueChange={setTrainerId}>
                <SelectTrigger id="class-trainer" className="w-full">
                  <SelectValue placeholder="Elige un entrenador" />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError
                errors={
                  state.fieldErrors?.trainerId
                    ? [{ message: state.fieldErrors.trainerId }]
                    : undefined
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="class-date">Fecha</FieldLabel>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="class-date"
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
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
                      disabled={{ before: isoToLocalDate(todayIso()) }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <FieldError
                  errors={
                    state.fieldErrors?.date ? [{ message: state.fieldErrors.date }] : undefined
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="class-time">Hora de inicio</FieldLabel>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="class-time" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError
                  errors={
                    state.fieldErrors?.startTime
                      ? [{ message: state.fieldErrors.startTime }]
                      : undefined
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="class-duration">Duración</FieldLabel>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="class-duration" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError
                  errors={
                    state.fieldErrors?.durationMinutes
                      ? [{ message: state.fieldErrors.durationMinutes }]
                      : undefined
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="class-capacity">Cupo máximo</FieldLabel>
                <Input
                  id="class-capacity"
                  name="maxCapacity"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={session?.maxCapacity ?? 12}
                  required
                />
                <FieldError
                  errors={
                    state.fieldErrors?.maxCapacity
                      ? [{ message: state.fieldErrors.maxCapacity }]
                      : undefined
                  }
                />
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || trainers.length === 0}>
              {pending ? <Spinner aria-label="Guardando clase" /> : null}
              {session ? "Guardar cambios" : "Programar clase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
