"use client";

import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/states/error-state";

export interface RetryErrorProps {
  title?: string;
  description: string;
}

/**
 * `ErrorState` con reintento para páginas Server Component: el reintento
 * refresca el segmento actual y vuelve a ejecutar la carga de datos.
 */
export function RetryError({ title, description }: RetryErrorProps) {
  const router = useRouter();

  return (
    <ErrorState
      title={title}
      description={description}
      onRetry={() => router.refresh()}
    />
  );
}
