"use client";

import { useState, useTransition } from "react";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { createReviewAction } from "@/app/actions/reviews";
import { StarRating } from "@/components/reviews/star-rating";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { REVIEW_COMMENT_MAX, type ReviewableClass } from "@/lib/types/reviews";

export interface ReviewDialogProps {
  session: ReviewableClass | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `rating` es `null` cuando el backend confirma que ya existía una reseña. */
  onReviewed: (sessionId: string, rating: number | null) => void;
}

/** H16 · Calificación de una clase con estrellas 1–5 y comentario opcional. */
export function ReviewDialog({
  session,
  open,
  onOpenChange,
  onReviewed,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!session) return;

    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createReviewAction({
        sessionId: session.sessionId,
        rating,
        comment,
      });

      if (!result.ok) {
        if (result.code === "conflict") {
          // No hay `GET` de reseñas propias: el `409` confirma que ya existía.
          toast.info("Esta clase ya tiene una reseña registrada.");
          onReviewed(session.sessionId, null);
          onOpenChange(false);
          return;
        }
        setError(result.message ?? "No pudimos guardar tu calificación.");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      toast.success("Gracias por tu calificación.");
      onReviewed(session.sessionId, result.review?.rating ?? rating);
      setRating(0);
      setComment("");
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calificar {session?.name ?? "la clase"}</DialogTitle>
          <DialogDescription>
            {session
              ? `${session.trainerName} · ${formatDate(session.date)} · ${session.startTime}`
              : null}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-destructive flex items-start gap-2 text-sm" role="alert">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}

        <FieldGroup>
          <Field>
            <FieldLabel>Calificación</FieldLabel>
            <StarRating value={rating} onChange={setRating} disabled={pending} />
            <FieldError
              errors={fieldErrors.rating ? [{ message: fieldErrors.rating }] : undefined}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="review-comment">Comentario (opcional)</FieldLabel>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(event) =>
                setComment(event.target.value.slice(0, REVIEW_COMMENT_MAX))
              }
              maxLength={REVIEW_COMMENT_MAX}
              rows={4}
              disabled={pending}
              placeholder="¿Qué te pareció la clase?"
            />
            <div className="text-muted-foreground flex justify-end text-xs">
              {comment.length}/{REVIEW_COMMENT_MAX}
            </div>
            <FieldError
              errors={fieldErrors.comment ? [{ message: fieldErrors.comment }] : undefined}
            />
          </Field>
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
          <Button type="button" onClick={handleSubmit} disabled={pending || rating === 0}>
            {pending ? <Spinner aria-label="Enviando calificación" /> : null}
            Enviar calificación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
