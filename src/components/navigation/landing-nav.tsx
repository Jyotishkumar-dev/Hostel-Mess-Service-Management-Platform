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
    <header className="sticky top-3 z-40 px-4 sm:px-6">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 rounded-2xl neu-raised bg-card/85 backdrop-blur-md px-5 sm:px-6">
        <Brand />

        <nav
          aria-label="Main"
          className="ml-auto hidden items-center gap-6 md:flex"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5 md:ml-0">
          <Button asChild variant="ghost" size="sm" className="rounded-xl font-medium">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl font-semibold">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/40 py-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Brand />
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Get started
            </p>
            <ul className="mt-3 space-y-2.5 text-sm font-medium">
              <li>
                <Link
                  href="/signup"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Create an account
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Campus Resolve. Closed-loop campus service excellence.</p>
          <p className="font-mono text-[11px] text-muted-foreground/70">Built with modern tactile Neumorphism</p>
        </div>
      </div>
    </footer>
  );
}
