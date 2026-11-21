"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { createAvailabilityAction } from "@/app/actions/availability";
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
import { dateToIso, isoToLocalDate } from "@/lib/date-range";
import { formatDate } from "@/lib/format";
import {
  AVAILABILITY_SLOT_MINUTES,
  AVAILABILITY_START_OPTIONS,
  addMinutes,
  formatTimeRange,
} from "@/lib/schedule";
import type { IsoDate, IsoTime } from "@/lib/types/common";

export interface AvailabilitySlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fecha seleccionada en la tabla; el diálogo la usa como valor inicial. */
  defaultDate: IsoDate;
  /** Hora preseleccionada cuando el alta arranca desde una fila vacía. */
  defaultStartTime: IsoTime | null;
  /** Horas ya registradas ese día: se deshabilitan para evitar un `409` evitable. */
  takenStartTimes: IsoTime[];
}

export function AvailabilitySlotDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultStartTime,
  takenStartTimes,
}: AvailabilitySlotDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo bloque</DialogTitle>
          <DialogDescription>
            Cada bloque dura {AVAILABILITY_SLOT_MINUTES} minutos y debe quedar dentro
            del horario del club (06:00 a 21:00).
          </DialogDescription>
        </DialogHeader>
        {/*
          El formulario se monta en cada apertura, así que su estado interno
          arranca con la fecha y la hora seleccionadas en la tabla sin
          sincronizaciones por efecto.
        */}
        <AvailabilityForm
          defaultDate={defaultDate}
          defaultStartTime={defaultStartTime}
          takenStartTimes={takenStartTimes}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface AvailabilityFormProps {
  defaultDate: IsoDate;
  defaultStartTime: IsoTime | null;
  takenStartTimes: IsoTime[];
  onDone: () => void;
}

function AvailabilityForm({
  defaultDate,
  defaultStartTime,
  takenStartTimes,
  onDone,
}: AvailabilityFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createAvailabilityAction,
    IDLE_FORM_STATE
  );
  const handled = useRef<FormState | null>(null);

  const [date, setDate] = useState<IsoDate>(defaultDate);
  const [dateOpen, setDateOpen] = useState(false);
  const [startTime, setStartTime] = useState<IsoTime>(defaultStartTime ?? "");

  useEffect(() => {
    if (!state.success || handled.current === state) return;
    handled.current = state;
    toast.success("Bloque registrado.");
    onDone();
    router.refresh();
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="startTime" value={startTime} />

      {state.error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>No se pudo registrar</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="availability-date">Fecha</FieldLabel>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <Button
                id="availability-date"
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
                autoFocus
              />
            </PopoverContent>
          </Popover>
          <FieldError
            errors={
              state.fieldErrors?.date
                ? [{ message: state.fieldErrors.date }]
                : undefined
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="availability-start">Hora de inicio</FieldLabel>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger id="availability-start" className="w-full">
              <SelectValue placeholder="Elige un bloque" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY_START_OPTIONS.map((time) => (
                <SelectItem
                  key={time}
                  value={time}
                  disabled={takenStartTimes.includes(time)}
                >
                  {formatTimeRange(time, addMinutes(time, AVAILABILITY_SLOT_MINUTES))}
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
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || !startTime}>
          {pending ? <Spinner aria-label="Registrando bloque" /> : null}
          Registrar bloque
        </Button>
      </DialogFooter>
    </form>
  );
}
