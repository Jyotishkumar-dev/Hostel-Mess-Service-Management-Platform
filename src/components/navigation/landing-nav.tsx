import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

/** Top-level marketing navigation. */
const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Services", href: "#services" },
  { label: "Transparency", href: "#transparency" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Brand />

        <nav
          aria-label="Main"
          className="ml-auto hidden items-center gap-6 md:flex"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/student">Student</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/** Footer with the three role entry points. */
export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Brand />
            <p className="mt-3 text-sm text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Portals
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/student"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Student dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Admin dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/staff"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Staff dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t pt-6 text-xs text-muted-foreground">
          Phase 1 interface build. Sample records are illustrative and do not
          represent real campus data.
        </p>
      </div>
    </footer>
  );
}
