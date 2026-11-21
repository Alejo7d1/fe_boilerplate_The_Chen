// lib/types/payments.ts
// H10 · Cobro y comprobante (MIEMBRO).
// H11 · Cobros pendientes (RECEPCION_ADMIN).
// Payload tomado de BE-10.1 / BE-11.x; los nombres alternativos se resuelven en
// lib/api/payments.ts.

import type { EntityId, IsoDate } from "@/lib/types/common";

/** H11 · Cobros por página en el listado administrativo. */
export const PENDING_CHARGES_PAGE_SIZE = 10;

/** `GET /api/charges/pending` · un cobro pendiente del miembro. */
export interface PendingCharge {
  id: EntityId;
  memberId?: EntityId;
  memberName?: string;
  memberCardNumber?: string;
  concept?: string;
  amount: number;
  dueDate?: IsoDate;
  status?: string;
}

/** Página del listado de cobros pendientes. */
export interface PendingChargesPage {
  charges: PendingCharge[];
  page: number;
  limit: number;
  /** Total de cobros que cumplen el filtro, según el backend. */
  total: number;
  totalPages: number;
}

export interface PendingChargesQuery {
  page?: number;
  limit?: number;
  startDate?: IsoDate;
  endDate?: IsoDate;
  memberId?: EntityId;
}

/** `POST /api/payments/process` */
export interface ProcessPaymentRequest {
  chargeId: EntityId;
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvv: string;
}

/**
 * Comprobante que devuelve el cobro aprobado (`receiptNumber` con formato
 * `REC-XXXXX`). El resto de campos son opcionales: si el backend no los envía,
 * la pantalla no los inventa.
 */
export interface PaymentReceipt {
  receiptNumber: string;
  amount?: number;
  paidAt?: IsoDate;
  concept?: string;
  /** Últimos cuatro dígitos de la tarjeta cobrada. */
  last4?: string;
  status?: string;
}
