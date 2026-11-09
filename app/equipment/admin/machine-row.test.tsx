import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Machine } from "@/lib/machines/types";
import { MachineRow } from "./machine-row";

const { saveMachineStatus } = vi.hoisted(() => ({
  saveMachineStatus: vi.fn(),
}));

vi.mock("@/app/actions/machines", () => ({ saveMachineStatus }));

const MACHINE: Machine = {
  id: "maquina-1",
  name: "Caminadora 1",
  status: "OPERATIVA",
  reason: null,
  updatedAt: "2026-11-01T10:00:00.000Z",
};

function setup() {
  const onSaved = vi.fn();
  const onError = vi.fn();
  const user = userEvent.setup();

  render(<MachineRow machine={MACHINE} onSaved={onSaved} onError={onError} />);

  return {
    user,
    onSaved,
    onError,
    status: screen.getByLabelText("Estado"),
    reason: screen.getByLabelText("Motivo"),
    saveButton: screen.getByRole("button", { name: "Guardar cambios" }),
  };
}

describe("MachineRow", () => {
  beforeEach(() => {
    saveMachineStatus.mockReset();
  });

  it("habilita Guardar solo con estado cambiado y motivo válido", async () => {
    const { user, status, reason, saveButton } = setup();

    expect(saveButton).toBeDisabled();
    expect(reason).toBeDisabled();

    await user.selectOptions(status, "EN_MANTENIMIENTO");

    expect(reason).toBeEnabled();
    expect(saveButton).toBeDisabled();

    await user.type(reason, "Cambio de banda");

    expect(saveButton).toBeEnabled();
  });

  it("limpia y deshabilita el motivo al volver a Operativa", async () => {
    const { user, status, reason } = setup();

    await user.selectOptions(status, "EN_MANTENIMIENTO");
    await user.type(reason, "Cambio de banda");
    await user.selectOptions(status, "OPERATIVA");

    expect(reason).toBeDisabled();
    expect(reason).toHaveValue("");
  });

  it("envía estado y motivo y notifica el guardado", async () => {
    const updated: Machine = {
      ...MACHINE,
      status: "EN_MANTENIMIENTO",
      reason: "Cambio de banda",
      updatedAt: "2026-11-08T16:00:00.000Z",
    };
    saveMachineStatus.mockResolvedValue({ outcome: "success", machine: updated });

    const { user, status, reason, saveButton, onSaved } = setup();

    await user.selectOptions(status, "EN_MANTENIMIENTO");
    await user.type(reason, "Cambio de banda");
    await user.click(saveButton);

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(updated));

    const formData = saveMachineStatus.mock.calls[0][0] as FormData;
    expect(formData.get("id")).toBe(MACHINE.id);
    expect(formData.get("status")).toBe("EN_MANTENIMIENTO");
    expect(formData.get("reason")).toBe("Cambio de banda");
  });

  it("muestra el error del backend y revierte la selección", async () => {
    saveMachineStatus.mockResolvedValue({
      outcome: "error",
      message: "Motivo requerido",
    });

    const { user, status, reason, saveButton, onError, onSaved } = setup();

    await user.selectOptions(status, "FUERA_DE_SERVICIO");
    await user.type(reason, "Falla del motor");
    await user.click(saveButton);

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Motivo requerido"),
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(status).toHaveValue("OPERATIVA");
    expect(reason).toHaveValue("");
    expect(saveButton).toBeDisabled();
  });
});
