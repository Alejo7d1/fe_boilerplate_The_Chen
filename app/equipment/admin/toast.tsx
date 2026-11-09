"use client";

import { useEffect } from "react";

export type Toast = {
  id: number;
  kind: "success" | "error";
  message: string;
};

const TOAST_STYLES: Record<Toast["kind"], string> = {
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  error:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

export function ToastAlert({
  toast,
  onDismiss,
}: {
  toast: Toast | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed right-4 top-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${TOAST_STYLES[toast.kind]}`}
    >
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar alerta"
        className="rounded p-0.5 text-base leading-none opacity-70 transition-opacity hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
