"use client";

import { useState, useTransition } from "react";
import { CircleAlert, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

import { assignRoutineAction } from "@/app/actions/training";
import { ExerciseEditor, type ExerciseRow } from "@/components/training/exercise-editor";
import { MemberSelector } from "@/components/training/member-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { MemberSummary } from "@/lib/types/members";
import type { Routine } from "@/lib/types/training";

const FIRST_ROW: ExerciseRow[] = [
  { key: "row-1", name: "", series: "3", reps: "10" },
];

/** H12 · Selector de cliente + filas de ejercicios + envío. */
export function RoutineBuilder() {
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [manualId, setManualId] = useState("");
  const [rows, setRows] = useState<ExerciseRow[]>(FIRST_ROW);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [pending, startTransition] = useTransition();

  const memberId = member?.id ?? manualId.trim();

  function handleSubmit() {
    setFormError(null);
    setErrors({});

    startTransition(async () => {
      const result = await assignRoutineAction({
        memberId,
        exercises: rows.map((row) => ({
          name: row.name,
          series: row.series,
          reps: row.reps,
        })),
      });

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.message ?? "No pudimos asignar la rutina.");
        return;
      }

      toast.success("Rutina asignada.");
      setRoutine(result.routine ?? null);
      setMember(null);
      setManualId("");
      setRows(FIRST_ROW);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {routine ? (
        <Alert>
          <ClipboardCheck />
          <AlertTitle>Rutina asignada</AlertTitle>
          <AlertDescription className="flex flex-col gap-1">
            <span>
              Folio <span className="font-mono text-xs">{routine.id}</span> para el
              miembro <span className="font-mono text-xs">{routine.memberId}</span>.
            </span>
            {routine.updatedAt ? (
              <span className="text-muted-foreground text-xs">
                Actualizada: {routine.updatedAt}
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
            <CardDescription>
              Elige al miembro que recibirá la rutina. Si la búsqueda no está
              habilitada para tu rol, captura su identificador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberSelector
              selected={member}
              manualId={manualId}
              onSelect={setMember}
              onClear={() => setMember(null)}
              onManualIdChange={setManualId}
              error={errors.memberId}
              disabled={pending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ejercicios</CardTitle>
            <CardDescription>
              Nombre, series y repeticiones de cada ejercicio. Se requiere al menos uno.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ExerciseEditor
              rows={rows}
              errors={errors}
              onChange={setRows}
              disabled={pending}
            />

            {formError ? (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>No se pudo asignar la rutina</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={pending || !memberId}
              className="w-fit"
            >
              {pending ? <Spinner aria-label="Asignando rutina" /> : <ClipboardCheck />}
              Asignar rutina
            </Button>
            {!memberId ? (
              <p className="text-muted-foreground text-xs">
                Selecciona un cliente para continuar.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
