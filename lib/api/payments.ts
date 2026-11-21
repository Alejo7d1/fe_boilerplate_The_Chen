// lib/api/payments.ts
// H10 · Procesamiento del cobro y comprobante.
// H11 · Listado paginado de cobros pendientes.
// Único lugar donde se conoce el contrato de /api/charges y /api/payments.

import { apiFetch } from "@/lib/api";
import { API_ROUTES } from "@/lib/api-routes";
import {
  asRecord,
  readArray,
  readNumber,
  readOptionalIsoDate,
  readOptionalNumber,
  readOptionalString,
  readString,
} from "@/lib/api/normalize";
import { last4Of } from "@/lib/payment-card";
import type {
  PaymentReceipt,
  PendingCharge,
  PendingChargesPage,
  PendingChargesQuery,
  ProcessPaymentRequest,
} from "@/lib/types/payments";
import { PENDING_CHARGES_PAGE_SIZE } from "@/lib/types/payments";

function nestedMemberName(record: Record<string, unknown>): string | undefined {
  const member = record.member ?? record.miembro ?? record.user;
  if (!member || typeof member !== "object" || Array.isArray(member)) return undefined;
  return readOptionalString(member as Record<string, unknown>, [
    "name",
    "fullName",
    "nombre",
  ]);
}

export function normalizePendingCharge(raw: unknown, context = "cobro"): PendingCharge {
  const record = asRecord(raw, context);
  return {
    id: readString(record, context, ["id", "_id", "chargeId"]),
    memberId: readOptionalString(record, ["memberId", "member_id", "userId"]),
    memberName:
      readOptionalString(record, ["memberName", "memberFullName"]) ??
      nestedMemberName(record),
    memberCardNumber: readOptionalString(record, [
      "cardNumber",
      "memberCardNumber",
      "carnet",
    ]),
    concept: readOptionalString(record, ["concept", "concepto", "description"]),
    amount: readNumber(record, context, ["amount", "monto", "total"]),
    dueDate: readOptionalIsoDate(record, ["dueDate", "date", "fecha", "createdAt"]),
    status: readOptionalString(record, ["status", "estado"]),
  };
}

/**
 * La paginación se toma de la respuesta cuando existe; si el backend no la
 * envía se calcula sobre lo recibido, sin inventar cobros adicionales.
 */
export function normalizePendingChargesPage(
  payload: unknown,
  query: PendingChargesQuery = {}
): PendingChargesPage {
  const requestedPage = query.page && query.page > 0 ? query.page : 1;
  const requestedLimit =
    query.limit && query.limit > 0 ? query.limit : PENDING_CHARGES_PAGE_SIZE;

  const charges = readArray(payload, "cobros pendientes").map((item, index) =>
    normalizePendingCharge(item, `cobros pendientes[${index}]`)
  );

  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  const total =
    readOptionalNumber(record, ["total", "totalCount", "count"]) ?? charges.length;
  const page = readOptionalNumber(record, ["page", "currentPage"]) ?? requestedPage;
  const limit =
    readOptionalNumber(record, ["limit", "perPage", "pageSize"]) ?? requestedLimit;
  const totalPages =
    readOptionalNumber(record, ["totalPages", "lastPage"]) ??
    Math.max(1, Math.ceil(total / limit));

  return { charges, page, limit, total, totalPages };
}

function buildPendingChargesQuery(query: PendingChargesQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(query.page && query.page > 0 ? query.page : 1));
  params.set(
    "limit",
    String(query.limit && query.limit > 0 ? query.limit : PENDING_CHARGES_PAGE_SIZE)
  );
  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);
  if (query.memberId) params.set("memberId", query.memberId);
  return params;
}

export async function listPendingCharges(
  query: PendingChargesQuery = {}
): Promise<PendingChargesPage> {
  const payload = await apiFetch<unknown>(
    `${API_ROUTES.billing.pendingCharges}?${buildPendingChargesQuery(query).toString()}`
  );
  return normalizePendingChargesPage(payload, query);
}

/** El comprobante puede venir envuelto en `receipt` o `data`. */
function unwrapReceipt(payload: unknown): unknown {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    for (const key of ["receipt", "data"]) {
      const nested = record[key];
      if (nested && typeof nested === "object" && !Array.isArray(nested)) return nested;
    }
  }
  return payload;
}

/**
 * `receiptNumber` es el único campo obligatorio: sin él no hay comprobante que
 * mostrar. `last4` cae a los dígitos de la tarjeta que el usuario envió.
 */
export function normalizePaymentReceipt(
  payload: unknown,
  fallbackLast4?: string
): PaymentReceipt {
  const record = asRecord(unwrapReceipt(payload), "comprobante");

  return {
    receiptNumber: readString(record, "comprobante", [
      "receiptNumber",
      "receipt_number",
      "numeroComprobante",
      "receipt",
    ]),
    amount: readOptionalNumber(record, ["amount", "monto", "total"]),
    paidAt: readOptionalIsoDate(record, ["paidAt", "paymentDate", "date", "fecha"]),
    concept: readOptionalString(record, ["concept", "concepto", "description"]),
    last4:
      readOptionalString(record, ["last4", "cardLast4", "lastFour"]) ?? fallbackLast4,
    status: readOptionalString(record, ["status", "estado"]),
  };
}

export async function processPayment(
  input: ProcessPaymentRequest
): Promise<PaymentReceipt> {
  const payload = await apiFetch<unknown>(API_ROUTES.billing.processPayment, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizePaymentReceipt(payload, last4Of(input.cardNumber));
}
