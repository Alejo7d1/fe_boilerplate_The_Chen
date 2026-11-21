"use client";

import { useState } from "react";
import { MessageSquareQuote, Star } from "lucide-react";

import { ReviewDialog } from "@/components/reviews/review-dialog";
import { StarRating } from "@/components/reviews/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { formatDate } from "@/lib/format";
import { isReviewWindowOpen, reviewDeadline } from "@/lib/review-rules";
import type { IsoDate } from "@/lib/types/common";
import type { ReviewableClass } from "@/lib/types/reviews";

export interface ReviewBoardProps {
  classes: ReviewableClass[];
  today: IsoDate;
}

/** Clases ya calificadas en esta visita: `null` cuando el backend reportó 409. */
type ReviewedMap = Record<string, number | null>;

/** H16 · Tarjetas de clases finalizadas con la acción de calificar. */
export function ReviewBoard({ classes, today }: ReviewBoardProps) {
  const [reviewed, setReviewed] = useState<ReviewedMap>({});
  const [target, setTarget] = useState<ReviewableClass | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openDialog(session: ReviewableClass) {
    setTarget(session);
    setDialogOpen(true);
  }

  function handleReviewed(sessionId: string, rating: number | null) {
    setReviewed((current) => ({ ...current, [sessionId]: rating }));
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareQuote}
        title="Aún no hay clases por calificar"
        description="Aquí aparecen las clases grupales finalizadas a las que asististe. Todavía no hay ninguna disponible para calificar."
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {classes.map((session) => {
          const isReviewed = Object.prototype.hasOwnProperty.call(
            reviewed,
            session.sessionId
          );
          const savedRating = reviewed[session.sessionId];
          const windowOpen = isReviewWindowOpen(session.date, today);

          return (
            <Card key={session.sessionId}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span>{session.name}</span>
                  {isReviewed ? <Badge>Calificada</Badge> : null}
                </CardTitle>
                <CardDescription>
                  {session.trainerName} · {formatDate(session.date)} · {session.startTime}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {isReviewed ? (
                  <div className="flex flex-col gap-1">
                    {savedRating ? (
                      <StarRating value={savedRating} size="sm" />
                    ) : null}
                    <p className="text-muted-foreground text-sm">
                      Ya registraste una reseña para esta clase.
                    </p>
                  </div>
                ) : windowOpen ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-fit"
                    onClick={() => openDialog(session)}
                  >
                    <Star />
                    Calificar
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    El plazo para calificar venció el {formatDate(reviewDeadline(session.date))}.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ReviewDialog
        key={target?.sessionId ?? "none"}
        session={target}
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next);
          if (!next) setTarget(null);
        }}
        onReviewed={handleReviewed}
      />
    </>
  );
}
