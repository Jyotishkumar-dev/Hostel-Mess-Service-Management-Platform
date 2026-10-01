import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { optionalUser, roleHome } from "@/lib/auth";
import {
  ArrowRight,
  Building2,
  ChartNoAxesColumn,
  ClipboardCheck,
  Eye,
  LineChart,
  MessageSquareText,
  Utensils,
} from "lucide-react";
import {
  LandingFooter,
  LandingNav,
} from "@/components/navigation/landing-nav";
import { LogoMark } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
};

const SERVICES = [
  {
    icon: Building2,
    title: "Hostel services",
    description:
      "Water, electricity, cleanliness, maintenance, internet and security — reported by the students who live with them.",
  },
  {
    icon: Utensils,
    title: "Mess & dining services",
    description:
      "Food quality, hygiene, serving queues and dining hours, tracked to the mess team that owns the fix.",
  },
  {
    icon: Eye,
    title: "Resolution transparency",
    description:
      "Every issue carries a visible status, an owner and a timestamp. Students can see exactly where it stands.",
  },
  {
    icon: LineChart,
    title: "Service improvement analytics",
    description:
      "Recurring problems surface as patterns rather than anecdotes, so effort goes where campus services actually break.",
  },
];

const STAGES = [
  {
    icon: MessageSquareText,
    title: "Student feedback",
    description: "Reported from the portal in under a minute.",
  },
  {
    icon: ClipboardCheck,
    title: "Admin triage",
    description: "Prioritised and routed to the right team.",
  },
  {
    icon: Building2,
    title: "Staff resolution",
    description: "Assigned work with an owner and a deadline.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Verification & analytics",
    description: "The student confirms the fix, or reopens it.",
  },
];

export default async function LandingPage() {
  // A signed-in visitor has a dashboard — send them straight there.
  const user = await optionalUser();
  if (user) redirect(roleHome(user.role));

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="gap-1.5">
                <LogoMark className="size-4 rounded-[5px]" />
                {siteConfig.tagline}
              </Badge>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Student feedback that ends in an actual fix.
              </h1>

              <p className="mt-5 max-w-xl text-base text-pretty text-muted-foreground">
                {siteConfig.description} Campus Resolve closes the loop between
                a student reporting a broken water line and the mess and hostel
                teams proving it was fixed.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">
                    Create account
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Phase 1 preview with sample records. Sign-in is now available in Phase 2.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-b">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <SectionIntro
              eyebrow="The loop"
              title="Four steps, one shared record"
              description="The same issue moves through every stage without losing its history, so nothing has to be re-explained."
            />

            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STAGES.map((stage, index) => (
                <li key={stage.title}>
                  <Card className="h-full gap-0">
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                          <stage.icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-4 text-sm font-medium">
                        {stage.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {stage.description}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="border-b">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <SectionIntro
              eyebrow="Coverage"
              title="Both sides of the campus plate"
              description="Hostel infrastructure and mess operations are usually managed separately. Here they share one queue and one standard of accountability."
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {SERVICES.map((service) => (
                <div
                  key={service.title}
                  className="flex gap-4 rounded-xl border bg-card p-5 ring-1 ring-foreground/10"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <service.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-medium">{service.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transparency */}
        <section id="transparency" className="border-b bg-muted/30">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Transparency
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                No complaint should disappear into a shared inbox.
              </h2>
              <p className="mt-4 text-sm text-pretty text-muted-foreground">
                Every issue keeps a public status — reported, assigned, in
                progress, resolved — and the student who raised it decides
                whether the fix actually held. If it did not, the issue reopens
                with the original context intact.
              </p>
              <Button asChild variant="link" className="mt-4 px-0">
                <Link href="/signup">
                  Try it
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
              <p className="text-xs text-muted-foreground">
                Example status progression
              </p>
              <ol className="mt-4 space-y-4">
                {[
                  { label: "Reported", note: "Student submits with a photo." },
                  {
                    label: "Assigned",
                    note: "Routed to the hostel maintenance team.",
                  },
                  {
                    label: "In progress",
                    note: "Site visit scheduled and logged.",
                  },
                  {
                    label: "Resolved",
                    note: "Awaiting the student's confirmation.",
                  },
                ].map((step, index) => (
                  <li key={step.label} className="flex gap-3">
                    <span
                      className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-[11px] font-medium tabular-nums"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {step.note}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-5 border-t pt-4 text-xs text-muted-foreground">
                Illustrative example. Real records arrive once Supabase is
                connected in Phase 2.
              </p>
            </div>
          </div>
        </section>

        {/* Roles */}
        <section>
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <SectionIntro
              eyebrow="Portals"
              title="One platform, three working views"
              description="Each role gets the information it needs and nothing it does not."
            />

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <RoleCard
                href="/signup"
                title="Student"
                description="Report an issue, track its status and confirm the fix."
                points={[
                  "Submit feedback in under a minute",
                  "See status and assigned team",
                  "Reopen if the fix did not hold",
                ]}
              />
              <RoleCard
                href="/signup"
                title="Admin"
                description="Triage the queue, prioritise work and watch service trends."
                points={[
                  "Campus-wide issue register",
                  "Priority and workload view",
                  "Category and resolution analytics",
                ]}
              />
              <RoleCard
                href="/signup"
                title="Staff"
                description="Work a clear, owned list and log what was actually done."
                points={[
                  "Assigned issues only",
                  "High-priority tasks first",
                  "Resolution notes and status updates",
                ]}
              />
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-sm text-pretty text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function RoleCard({
  href,
  title,
  description,
  points,
}: {
  href: string;
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <Card className="group h-full gap-0 transition-colors hover:bg-accent/30">
      <CardContent className="flex h-full flex-col p-5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <ul className="mt-4 flex-1 space-y-2">
          {points.map((point) => (
            <li key={point} className="flex gap-2 text-sm text-muted-foreground">
              <span
                aria-hidden="true"
                className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground"
              />
              {point}
            </li>
          ))}
        </ul>
        <Button asChild variant="link" size="sm" className="mt-5 self-start px-0">
          <Link href={href}>
            Learn more about {title.toLowerCase()} view
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}