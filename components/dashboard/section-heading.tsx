import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface SectionHeadingProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function SectionHeading({
  title,
  description,
  icon: Icon,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-heading flex items-center gap-2 text-base font-semibold">
          {Icon ? <Icon className="text-primary size-4" aria-hidden /> : null}
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground text-xs">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
