import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DashboardPanelProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: { label: string; href: string };
  children: ReactNode;
  className?: string;
}

export function DashboardPanel({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: DashboardPanelProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon ? (
            <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
              <Icon className="size-3.5" aria-hidden />
            </span>
          ) : null}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? (
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href={action.href}>
                {action.label}
                <ArrowRight />
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">{children}</CardContent>
    </Card>
  );
}
