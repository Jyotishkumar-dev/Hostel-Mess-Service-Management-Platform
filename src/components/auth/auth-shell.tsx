import { Brand } from "@/components/layout/brand";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Shared layout for authentication pages (login, signup).
 *
 * Centers a card with the brand, a title, description, and the form.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh flex items-center justify-center px-4 py-12 bg-background overflow-hidden">
      {/* Ambient gradient lights for frosted glass refraction */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

      <Card className="relative z-10 w-full max-w-md neu-glass-card rounded-3xl p-4">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center">
            <Brand />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold tracking-tight text-foreground">{title}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">{children}</CardContent>
        {footer ? <CardFooter className="flex justify-center pt-2 border-t border-border/40 text-xs text-muted-foreground">{footer}</CardFooter> : null}
      </Card>
    </div>
  );
}