import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatTile } from "@/lib/mock/statistics";

/**
 * The headline number tile used across all three dashboards.
 *
 * The value is always the loudest thing in the tile; the label and hint stay
 * quiet so a row of these reads as a set rather than as six competing banners.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  suffix,
}: {
  label: string;
  value: number;
  hint: string;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  suffix?: string;
}) {
  return (
    <Card className="gap-0 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[9px_9px_22px_var(--neu-shadow-dark),-9px_-9px_22px_var(--neu-shadow-light)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide uppercase text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl neu-inset-sm bg-card/70 text-primary">
            <Icon className="size-4.5" aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline gap-2 pt-3">
        <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </span>
        {suffix ? (
          <span className="text-sm font-semibold text-muted-foreground">
            {suffix}
          </span>
        ) : null}
        {trend ? <TrendPill {...trend} /> : null}
      </div>

      <p className="pt-2 text-xs text-muted-foreground/80">{hint}</p>
    </Card>
  );
}

function TrendPill({
  value,
  direction,
}: {
  value: string;
  direction: "up" | "down" | "flat";
}) {
  const Icon =
    direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold neu-raised-sm",
        direction === "up" && "bg-status-resolved-bg text-status-resolved-fg",
        direction === "down" && "bg-status-reopened-bg text-status-reopened-fg",
        direction === "flat" && "bg-card text-muted-foreground",
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {value}
    </span>
  );
}

/** Renders a list of `StatTile` values from the mock/statistics layer. */
export function StatCardRow({
  stats,
  icons,
}: {
  stats: StatTile[];
  icons?: LucideIcon[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          hint={stat.hint}
          suffix={stat.suffix}
          icon={icons?.[index]}
        />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="gap-0 py-4">
      <div className="flex items-center justify-between px-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-7" />
      </div>
      <div className="px-4 pt-3">
        <Skeleton className="h-7 w-12" />
      </div>
      <div className="px-4 pt-2">
        <Skeleton className="h-3 w-28" />
      </div>
    </Card>
  );
}
