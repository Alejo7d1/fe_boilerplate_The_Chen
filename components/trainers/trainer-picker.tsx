"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { TrainerSummary } from "@/lib/types/trainers";

export interface TrainerPickerProps {
  trainers: TrainerSummary[];
  selectedTrainerId: string;
}

/**
 * La selección vive en la URL (`?trainer=`): el Server Component vuelve a
 * resolver la disponibilidad de ese entrenador sin cargar la de todos.
 */
export function TrainerPicker({ trainers, selectedTrainerId }: TrainerPickerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedTrainerId}
        disabled={pending}
        onValueChange={(value) => {
          startTransition(() => {
            router.push(`/trainers/book?trainer=${encodeURIComponent(value)}`);
          });
        }}
      >
        <SelectTrigger className="w-full sm:w-64" aria-label="Entrenador">
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
      {pending ? <Spinner aria-label="Cargando la agenda" /> : null}
    </div>
  );
}
