import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/**
 * Product wordmark. Drawn rather than imported so it inherits the theme colour
 * tokens and stays crisp at every size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-xl neu-raised-sm bg-card text-primary font-bold shadow-xs",
        className,
      )}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="size-4.5 text-primary"
      >
        <path
          d="M4.5 10.4 8.3 14l7.2-8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <LogoMark />
      <span className="text-sm font-semibold tracking-tight">
        {siteConfig.name}
      </span>
    </Link>
  );
}
