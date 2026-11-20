import type { EntityId, IsoDate, IsoTime } from "@/lib/types/common";

export interface FinancialReport {
  period?: string;
  totalRevenue?: number;
  paymentCount?: number;
  renewals?: number;
  renewalRate?: number;
}

export interface OccupancyReportRow {
  id?: EntityId;
  className?: string;
  date?: IsoDate;
  startTime?: IsoTime;
  maxCapacity?: number;
  reservedCount?: number;
  availableSpots?: number;
  occupancyRate?: number;
  occupancyPercentage?: number;
}
