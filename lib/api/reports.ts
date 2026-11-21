// H20/H21 · Reportes administrativos.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  readArray,
  readOptionalIsoDate,
  readOptionalIsoTime,
  readOptionalNumber,
  readOptionalString,
} from "@/lib/api/normalize";
import type { FinancialReport, OccupancyReportRow } from "@/lib/types/reports";

function validDateRange(startDate: string, endDate: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error("Las fechas de reporte deben tener formato YYYY-MM-DD.");
  }
  if (startDate > endDate) {
    throw new Error("La fecha inicial no puede ser posterior a la fecha final.");
  }
}

export function normalizeFinancialReport(raw: unknown): FinancialReport {
  const record = asRecord(raw, "reporte financiero");
  return {
    period: readOptionalString(record, ["period", "periodo"]),
    totalRevenue: readOptionalNumber(record, [
      "totalRevenue",
      "totalIncome",
      "ingresosTotales",
    ]),
    paymentCount: readOptionalNumber(record, ["paymentCount", "cantidadPagos"]),
    renewals: readOptionalNumber(record, ["renewals", "renovaciones"]),
    renewalRate: readOptionalNumber(record, [
      "renewalRate",
      "renovationRate",
      "tasaRenovacion",
    ]),
  };
}

export function normalizeOccupancyReportRow(
  raw: unknown,
  context = "fila de ocupación"
): OccupancyReportRow {
  const record = asRecord(raw, context);
  return {
    id: readOptionalString(record, ["id", "classId"]),
    className: readOptionalString(record, ["className", "nombreClase", "name"]),
    date: readOptionalIsoDate(record, ["date", "fecha"]),
    startTime: readOptionalIsoTime(record, ["startTime", "horaInicio"]),
    maxCapacity: readOptionalNumber(record, ["maxCapacity", "cupoMaximo"]),
    reservedCount: readOptionalNumber(record, ["reservedCount", "reservasActivas"]),
    availableSpots: readOptionalNumber(record, ["availableSpots", "cuposDisponibles"]),
    occupancyRate: readOptionalNumber(record, ["occupancyRate", "tasaOcupacion"]),
    occupancyPercentage: readOptionalNumber(record, [
      "occupancyPercentage",
      "porcentajeOcupacion",
    ]),
  };
}

export async function getFinancialReport(
  startDate: string,
  endDate: string
): Promise<FinancialReport> {
  validDateRange(startDate, endDate);
  const query = new URLSearchParams({ startDate, endDate });
  const payload = await apiFetch<unknown>(
    `${API_ROUTES.reports.financial}?${query.toString()}`
  );
  return normalizeFinancialReport(payload);
}

export async function getOccupancyReport(
  startDate: string,
  endDate: string,
  classId?: string
): Promise<OccupancyReportRow[]> {
  validDateRange(startDate, endDate);
  const query = new URLSearchParams({ startDate, endDate });
  if (classId?.trim()) query.set("classId", classId.trim());
  const payload = await apiFetch<unknown>(
    `${API_ROUTES.reports.occupancy}?${query.toString()}`
  );
  return readArray(payload, "reporte de ocupación").map((item, index) =>
    normalizeOccupancyReportRow(item, `ocupación[${index}]`)
  );
}
