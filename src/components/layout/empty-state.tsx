import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The shared "there is nothing here yet" state.
 *
 * Always give the reader a next action — an empty dashboard without one feels
 * broken rather than new.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl neu-glass-card border border-dashed border-border/70 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl neu-glass-inset text-muted-foreground">
        <Icon className="size-6 text-primary/80" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
