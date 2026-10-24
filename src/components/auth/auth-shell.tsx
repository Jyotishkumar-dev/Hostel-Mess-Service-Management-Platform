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
    <div className="min-h-dvh flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md neu-raised rounded-3xl p-4 bg-card">
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