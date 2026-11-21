import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressChart } from "@/components/training/progress-chart";
import type { ProgressEntry } from "@/lib/types/training";

function entry(date: string, weight: number): ProgressEntry {
  return {
    id: `progress-${date}`,
    date,
    weight,
    waist: 84,
    chest: 102,
    strengthMarks: [],
  };
}

describe("ProgressChart", () => {
  it("no dibuja nada con menos de dos mediciones", () => {
    const { container } = render(<ProgressChart entries={[entry("2026-11-01", 80)]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("traza una línea ordenada por fecha y rotula el rango", () => {
    const entries = [
      entry("2026-11-15", 77.5),
      entry("2026-11-01", 80),
      entry("2026-11-08", 79),
    ];
    render(<ProgressChart entries={entries} metric="weight" />);

    const chart = screen.getByRole("img");
    expect(chart).toHaveAccessibleName(/3 mediciones/);

    // Tres puntos y una sola ruta con 3 segmentos.
    expect(chart.querySelectorAll("circle")).toHaveLength(3);
    const path = chart.querySelector("path")?.getAttribute("d") ?? "";
    expect(path.match(/[ML]/g)).toHaveLength(3);

    // El eje se rotula con el valor máximo y mínimo del conjunto.
    const labels = Array.from(chart.querySelectorAll("text")).map((node) => node.textContent);
    expect(labels).toContain("80");
    expect(labels).toContain("77.5");

    expect(screen.getByText(/Peso \(kg\) · 3 mediciones/)).toBeInTheDocument();
  });
});
