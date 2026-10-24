import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { optionalUser, roleHome } from "@/lib/auth";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MessageSquareText,
  Sparkles,
  Utensils,
  Wrench,
} from "lucide-react";
import {
  LandingFooter,
  LandingNav,
} from "@/components/navigation/landing-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
};

const STATS = [
  { label: "Resolution Rate", value: "98.4%", hint: "Closed-loop verified" },
  { label: "Average Response", value: "< 18h", hint: "From submission to staff triage" },
  { label: "Verified Fixes", value: "100%", hint: "Confirmed by the reporting student" },
  { label: "Campus Covered", value: "Hostel & Mess", hint: "Unified operations queue" },
];

const SERVICES = [
  {
    icon: Building2,
    badge: "Hostel Facilities",
    title: "Hostel & Living Infrastructure",
    description:
      "Water supply, electrical fittings, room maintenance, Wi-Fi connectivity, and block security — reported directly by resident students.",
    features: [
      "Room & wing specific routing",
      "Priority escalation for critical utilities",
      "Photo proof on completion",
    ],
  },
  {
    icon: Utensils,
    badge: "Mess Operations",
    title: "Mess & Dining Quality",
    description:
      "Meal quality, hygiene standards, serving counters, and dining timings tracked directly to the campus caterers and wardens.",
    features: [
      "Meal-slot specific reporting",
      "Direct warden & mess committee oversight",
      "Trend analytics on recurring feedback",
    ],
  },
];

const STAGES = [
  {
    icon: MessageSquareText,
    step: "01",
    title: "Report Feedback",
    description: "Submit in under a minute with location, category, and photo evidence.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "AI Triage & Assign",
    description: "Smart priority scoring routes the issue instantly to the right staff team.",
  },
  {
    icon: Wrench,
    step: "03",
    title: "Staff Action",
    description: "Assigned staff complete the work, log notes, and upload resolution proof.",
  },
  {
    icon: CheckCircle2,
    step: "04",
    title: "Student Verification",
    description: "The student inspects the fix, confirms resolution, or reopens if unsatisfied.",
  },
];

export default async function LandingPage() {
  const user = await optionalUser();
  if (user) redirect(roleHome(user.role));

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <LandingNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              {/* Floating Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 neu-raised-sm bg-card text-xs font-semibold">
                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse" />
                <span className="text-foreground">Campus Resolve Platform</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-primary font-bold">Closed-Loop Resolution</span>
              </div>

              <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl sm:leading-[1.15]">
                Student feedback that actually gets fixed.
              </h1>

              <p className="mt-6 text-base text-pretty text-muted-foreground sm:text-lg sm:leading-relaxed">
                One unified platform connecting students with hostel maintenance and mess
                operations. Report in seconds, track every step live, and verify the final fix.
              </p>

              {/* Tactile CTAs */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg" className="rounded-2xl px-6 h-12 text-base font-semibold neu-glow-primary">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl px-6 h-12 text-base font-medium">
                  <Link href="/login">Sign In to Portal</Link>
                </Button>
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl neu-raised bg-card p-5 text-center transition-all duration-300 hover:-translate-y-1"
                >
                  <p className="text-2xl font-black tracking-tight text-primary sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-bold tracking-wide uppercase text-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {stat.hint}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works: 4-Stage Loop */}
        <section id="how-it-works" className="py-20 border-t border-border/50">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold tracking-wider uppercase text-primary">
                The Closed Loop
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Four clear steps, zero lost complaints
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Every issue stays in one synchronized register with full timeline transparency until verified by you.
              </p>
            </div>

            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STAGES.map((stage) => (
                <li key={stage.title}>
                  <Card className="h-full rounded-3xl neu-raised bg-card transition-all duration-300 hover:-translate-y-1.5 p-6">
                    <CardContent className="flex h-full flex-col p-0">
                      <div className="flex items-center justify-between">
                        <span className="flex size-11 items-center justify-center rounded-2xl neu-inset-sm bg-card/70 text-primary">
                          <stage.icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="text-xs font-mono font-bold text-muted-foreground neu-raised-sm rounded-full px-2.5 py-0.5">
                          {stage.step}
                        </span>
                      </div>
                      <h3 className="mt-5 text-base font-bold text-foreground">
                        {stage.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {stage.description}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-20 border-t border-border/50">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold tracking-wider uppercase text-primary">
                Coverage
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Hostel and mess under one umbrella
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                No more wondering which committee or supervisor to email. All campus facilities share one queue.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {SERVICES.map((service) => (
                <div
                  key={service.title}
                  className="rounded-3xl neu-raised bg-card p-7 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex size-12 items-center justify-center rounded-2xl neu-inset-sm bg-card/70 text-primary">
                        <service.icon className="size-6" aria-hidden="true" />
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                          {service.badge}
                        </span>
                        <h3 className="text-lg font-bold text-foreground">
                          {service.title}
                        </h3>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <ul className="mt-6 space-y-2 border-t border-border/50 pt-4">
                    {service.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transparency Section */}
        <section id="transparency" className="py-20 border-t border-border/50">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-primary">
                Accountability
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Full transparency. Every action is timestamped.
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Never lose an issue in WhatsApp groups or ignored logbooks. Each complaint
                generates a tracked ID, shows who owns the task, records repair proof, and
                cannot be marked complete without your verification.
              </p>

              <div className="mt-8 flex gap-3">
                <Button asChild size="lg" className="rounded-2xl px-6 font-semibold neu-glow-primary">
                  <Link href="/signup">
                    Submit Your Feedback
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Interactive Timeline Mockup */}
            <div className="rounded-3xl neu-raised bg-card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-primary" />
                  <span className="font-mono text-xs font-bold text-foreground">CMP-1048</span>
                </div>
                <span className="rounded-full neu-raised-sm bg-status-in-progress-bg px-2.5 py-0.5 text-xs font-semibold text-status-in-progress-fg">
                  In Progress
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  {
                    step: "1",
                    title: "Reported by Student",
                    detail: "Water cooler leak on Block B, 2nd floor with photo attached.",
                    time: "10:15 AM",
                    done: true,
                  },
                  {
                    step: "2",
                    title: "Admin Triaged & Assigned",
                    detail: "Assigned to Plumbing & Facilities Team.",
                    time: "10:30 AM",
                    done: true,
                  },
                  {
                    step: "3",
                    title: "Staff Attended & Repairing",
                    detail: "Technician on site replacing faulty inlet pipe valve.",
                    time: "11:20 AM",
                    done: true,
                  },
                  {
                    step: "4",
                    title: "Student Verification",
                    detail: "Student confirms repair meets standards.",
                    time: "Pending confirmation",
                    done: false,
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3.5">
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        item.done
                          ? "neu-raised-sm bg-primary text-primary-foreground"
                          : "neu-inset-sm bg-card text-muted-foreground"
                      }`}
                    >
                      {item.step}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground">{item.title}</p>
                        <span className="text-[10px] font-mono text-muted-foreground">{item.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Roles Portals Section */}
        <section className="py-20 border-t border-border/50">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold tracking-wider uppercase text-primary">
                Access Portals
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Tailored for every campus role
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Dedicated interfaces with the exact tools each role requires.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <RoleCard
                title="Student Portal"
                role="Resident Student"
                description="Lodge complaints in under 60 seconds, follow live progress, and confirm fixes."
                points={[
                  "Instant report creation with photos",
                  "Live status timeline & notifications",
                  "Final verification and reopening controls",
                ]}
              />
              <RoleCard
                title="Staff Portal"
                role="Maintenance & Mess Staff"
                description="Clear work queues, task priorities, resolution note logging, and completion proofs."
                points={[
                  "Mobile-friendly assigned task list",
                  "High-priority issue alerts",
                  "Upload photo proof of completed work",
                ]}
              />
              <RoleCard
                title="Admin Portal"
                role="Warden & Campus Ops"
                description="Full campus register, AI insights, recurring problem analytics, and workload triage."
                points={[
                  "Campus-wide issue overview & filtering",
                  "Automated duplicate detection & AI triage",
                  "SLA escalation tracking and service trends",
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

function RoleCard({
  title,
  role,
  description,
  points,
}: {
  title: string;
  role: string;
  description: string;
  points: string[];
}) {
  return (
    <Card className="h-full rounded-3xl neu-raised bg-card p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5">
      <CardContent className="p-0 flex flex-col h-full">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          {role}
        </span>
        <h3 className="mt-1 text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>

        <ul className="mt-6 flex-1 space-y-2.5 border-t border-border/50 pt-4">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-xs text-foreground font-medium">
              <span className="size-1.5 mt-1.5 shrink-0 rounded-full bg-primary" />
              {point}
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-border/50">
          <Button asChild variant="outline" className="w-full rounded-xl font-semibold">
            <Link href="/signup">
              Access {title}
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}