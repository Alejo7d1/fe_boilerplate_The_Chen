import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/lib/status";

export interface StatusBadgeProps {
  label: string;
  tone: BadgeTone;
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <Badge variant={tone}>{label}</Badge>;
}
