// lib/types/payments.ts
// H10 · Procesamiento de pagos (dependencia de los flujos de compra).
// Payload tomado de BE-10.1. Contrato pendiente de confirmar: ver docs/api-contracts.md.

import type { EntityId } from "@/lib/types/common";

export interface ProcessPaymentRequest {
  chargeId: EntityId;
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvv: string;
}

export interface ProcessPaymentResponse {
  /** Comprobante con formato `REC-XXXXX`. TODO(contract): nombre del campo. */
  receiptNumber: string;
  /** BE-10.1: el cobro pasa a `PAGADO` cuando la transacción es aprobada. */
  status: "PAGADO";
}
