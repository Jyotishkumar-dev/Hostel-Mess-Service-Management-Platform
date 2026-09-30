import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A titled panel that wraps a chart.
 *
 * The `note` line is where we state that the data is illustrative — keep it in
 * place on every mock-backed chart so nothing reads as a real measurement.
 */
export function ChartCard({
  title,
  description,
  note,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  note?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? (
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            {action}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {children}
        {note ? <ChartNote className="mt-4">{note}</ChartNote> : null}
      </CardContent>
    </Card>
  );
}

/** The standing disclaimer used on every mock-data panel. */
export function ChartNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "border-t pt-3 text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function ChartCardSkeleton({ height = 260 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-4 w-36" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-3 w-52" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton style={{ height }} className="w-full" />
      </CardContent>
    </Card>
  );
}
