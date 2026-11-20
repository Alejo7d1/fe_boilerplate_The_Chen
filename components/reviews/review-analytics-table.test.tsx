import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewAnalyticsTable } from "@/components/reviews/review-analytics-table";
import type { ReviewAverage } from "@/lib/types/reviews";

const NO_REVIEWS: ReviewAverage = {
  targetType: "TRAINER",
  targetId: "usr-trainer",
  targetName: "Carlos Mendoza",
  average: null,
  totalReviews: 0,
};

const WITH_REVIEWS: ReviewAverage = {
  targetType: "CLASS",
  targetId: "class-yoga",
  targetName: "Yoga Flow",
  average: 4.25,
  totalReviews: 8,
};

describe("ReviewAnalyticsTable", () => {
  it("muestra «Sin calificaciones» cuando el promedio es null", () => {
    render(<ReviewAnalyticsTable averages={[NO_REVIEWS]} />);

    expect(screen.getByText("Sin calificaciones")).toBeInTheDocument();
    expect(screen.getByText("Entrenador")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("muestra el promedio con una décima y el conteo de reseñas", () => {
    render(<ReviewAnalyticsTable averages={[WITH_REVIEWS]} />);

    expect(screen.getByText("4.3 / 5")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Clase")).toBeInTheDocument();
    expect(screen.getByLabelText("4 de 5 estrellas")).toBeInTheDocument();
  });

  it("muestra «—» cuando el backend no informa el conteo", () => {
    render(<ReviewAnalyticsTable averages={[{ ...WITH_REVIEWS, totalReviews: null }]} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("usa el estado vacío cuando no hay promedios", () => {
    render(<ReviewAnalyticsTable averages={[]} />);

    expect(screen.getByText("Aún no hay promedios")).toBeInTheDocument();
  });
});
