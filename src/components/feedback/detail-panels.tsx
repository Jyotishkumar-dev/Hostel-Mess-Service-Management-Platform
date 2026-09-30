import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** A label/value grid used across the complaint detail pages. */
export function DetailList({
  items,
  className,
}: {
  items: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A titled panel with an icon, used to break detail pages into sections. */
export function DetailSection({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            <CardTitle className="text-sm">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            ) : null}
          </div>
        </div>
        {action ? (
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            {action}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
