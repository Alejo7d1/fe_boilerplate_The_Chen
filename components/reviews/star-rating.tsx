"use client";

import { Star } from "lucide-react";

import { REVIEW_RATING_MAX } from "@/lib/types/reviews";
import { cn } from "@/lib/utils";

const STARS = Array.from({ length: REVIEW_RATING_MAX }, (_, index) => index + 1);

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "default";
}

const ICON_SIZE = { sm: "size-3.5", default: "size-5" } as const;

/** Estrellas 1–5: solo lectura sin `onChange`, seleccionables cuando lo recibe. */
export function StarRating({
  value,
  onChange,
  disabled = false,
  size = "default",
}: StarRatingProps) {
  if (!onChange) {
    return (
      <span
        className="inline-flex items-center gap-0.5"
        aria-label={`${value} de ${REVIEW_RATING_MAX} estrellas`}
        role="img"
      >
        {STARS.map((star) => (
          <Star
            key={star}
            aria-hidden
            className={cn(
              ICON_SIZE[size],
              star <= value ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"
            )}
          />
        ))}
      </span>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Calificación en estrellas"
      className="flex items-center gap-1"
    >
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
          disabled={disabled}
          onClick={() => onChange(star)}
          className="focus-visible:ring-ring rounded p-0.5 transition hover:scale-110 focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
        >
          <Star
            aria-hidden
            className={cn(
              ICON_SIZE[size],
              star <= value ? "fill-amber-500 text-amber-500" : "text-muted-foreground/50"
            )}
          />
        </button>
      ))}
    </div>
  );
}
