"use client";

import { CircleCheck, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PaymentReceipt as PaymentReceiptData } from "@/lib/types/payments";

export interface PaymentReceiptProps {
  receipt: PaymentReceiptData;
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/** Comprobante de H10. Solo imprime lo que el backend confirmó. */
export function PaymentReceipt({ receipt }: PaymentReceiptProps) {
  return (
    <Card className="max-w-xl print:border-0 print:shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleCheck
            className="size-5 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          Pago aprobado
        </CardTitle>
        <CardDescription>
          Guarda o imprime el comprobante con el número de recibo.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="bg-muted/40 rounded-lg border px-4 py-3">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            Comprobante
          </p>
          <p className="font-mono text-lg font-semibold">{receipt.receiptNumber}</p>
        </div>

        {receipt.amount !== undefined ? (
          <ReceiptRow label="Monto" value={formatCurrency(receipt.amount)} />
        ) : null}
        {receipt.paidAt ? (
          <ReceiptRow label="Fecha" value={formatDate(receipt.paidAt)} />
        ) : null}
        {receipt.concept ? <ReceiptRow label="Concepto" value={receipt.concept} /> : null}
        {receipt.last4 ? (
          <ReceiptRow label="Tarjeta" value={`•••• •••• •••• ${receipt.last4}`} />
        ) : null}
        {receipt.status ? <ReceiptRow label="Estado" value={receipt.status} /> : null}

        <Button
          type="button"
          variant="outline"
          className="mt-2 w-fit print:hidden"
          onClick={() => window.print()}
        >
          <Printer />
          Imprimir comprobante
        </Button>
      </CardContent>
    </Card>
  );
}
