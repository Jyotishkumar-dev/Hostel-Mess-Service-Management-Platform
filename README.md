# Campus Resolve — Hostel & Mess Service Management Platform

**From Feedback to Fix.**

One platform to connect student feedback with hostel and mess service
improvement. Feedback is reported, prioritised, acted on by staff, verified by
the student who raised it, and fed back into service analytics.

> **Phase 1 status — project foundation and UI shell.**
> Every record in this build is sample data from `src/lib/mock/`. The
> interface, navigation, design system, validation setup and Supabase client
> foundation are real; the data behind them is not yet.

---

## Stack

| Concern      | Choice                                    |
| ------------ | ----------------------------------------- |
| Framework    | Next.js 16 (App Router, Turbopack)        |
| Language     | TypeScript (strict)                       |
| Styling      | Tailwind CSS v4                           |
| Components   | shadcn/ui                                 |
| Backend      | Supabase (PostgreSQL, Auth, Storage)      |
| Validation   | Zod + React Hook Form                     |
| Charts       | Recharts                                  |
| Icons        | lucide-react                              |
| Linting      | ESLint                                    |

There is no separate API server. Server-side work happens in Next.js Server
Components, Server Actions and Route Handlers, and Supabase is the managed
backend.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # optional in Phase 1 — no code reads it yet
npm run dev
```

Open <http://localhost:3000>.

### Scripts

| Command            | What it does                          |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Development server                    |
| `npm run build`    | Production build                      |
| `npm run start`    | Serve the production build            |
| `npm run lint`     | ESLint                                |
| `npm run typecheck`| Generate route types, then `tsc`      |

`npm run typecheck` runs `next typegen` first because Next generates the
global `PageProps<...>` and `LayoutProps<...>` types used by `app/` pages. Run it
rather than calling `tsc` directly on a fresh clone.

---

## Routes

| Route                        | Role    | Purpose                                  |
| ---------------------------- | ------- | ---------------------------------------- |
| `/`                          | —       | Landing page                             |
| `/student`                   | Student | Dashboard: totals, status, recent issues |
| `/student/complaints`        | Student | All reported issues, filterable         |
| `/student/complaints/new`    | Student | Feedback form (validation only)          |
| `/student/complaints/[id]`   | Student | Issue detail and status timeline        |
| `/admin`                     | Admin   | Campus service health                   |
| `/admin/issues`              | Admin   | Issue register                           |
| `/admin/analytics`           | Admin   | Charts and recurring issues             |
| `/admin/staff`               | Admin   | Staff workload                           |
| `/staff`                     | Staff   | Assigned work                            |
| `/staff/issues`              | Staff   | Assigned issue list                      |
| `/staff/issues/[id]`         | Staff   | Issue detail                             |

There is no authentication yet. The **role switcher** in the top bar jumps
between the three portals so the product can be demonstrated end to end. In
Phase 2 it is replaced by the role from the Supabase session.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                  Landing page
│   ├── layout.tsx                Root layout: fonts, metadata, tooltip provider
│   ├── globals.css               All design tokens
│   ├── error.tsx                 App-wide error boundary
│   ├── not-found.tsx             404 page
│   ├── loading.tsx
│   └── (dashboard)/              Authenticated routes share one shell
│       ├── layout.tsx?           (per-role layouts live in each folder)
│       ├── loading.tsx           Dashboard loading skeleton
│       ├── error.tsx             Portal-level error boundary
│       ├── student/
│       ├── admin/
│       └── staff/
│
├── components/
│   ├── ui/                       shadcn/ui primitives (do not edit by hand)
│   ├── layout/                   Shell, page header, empty state, brand
│   ├── navigation/               Sidebar nav, topbar, landing nav
│   ├── dashboard/                Stat cards, chart card, Recharts wrappers
│   ├── feedback/                 Complaint card, table, list, detail, timeline
│   └── forms/                    Complaint form
│
├── config/
│   ├── status.ts                 Status + priority styles (single source of truth)
│   ├── navigation.ts             Role navigation and placeholder identities
│   └── site.ts                   Product name and description
│
├── hooks/
│   └── use-complaint-filters.ts  Filtering and sorting for complaint lists
│
├── lib/
│   ├── mock/                     ALL sample data (replaced in Phase 2)
│   ├── supabase/                 Browser and server clients
│   ├── validations/              Zod schemas (no UI logic)
│   ├── format.ts                 Number and string helpers
│   └── utils.ts                  `cn` class-name helper
│
└── types/
    ├── index.ts                  Role, navigation and chart types
    └── complaint.ts              Complaint, status, priority, category
```

---

## Design system

All colour, radius and status styling is declared once in
`src/app/globals.css` and consumed through Tailwind theme tokens.

**Statuses** — `reported`, `assigned`, `in_progress`, `resolved`, `reopened`
**Priorities** — `critical`, `high`, `medium`, `low`

`src/config/status.ts` maps each value to its label, description, icon and
colour classes. Components (`StatusBadge`, `PriorityBadge`, `StatusDot`) read
from it. **Never style a status inline** — a complaint must look identical on
the student dashboard, the admin register and the staff detail page.

Reusable patterns: `PageHeader`, `StatCard`, `EmptyState`, `ComplaintCard`,
`ComplaintTable`, `ChartCard`, `SidebarNav`, `Topbar`, `DashboardShell`.

### Adding a shadcn component

```bash
npx shadcn@latest add <component> -y
sed -i '' 's|from "cn"|from "@/lib/utils"|g' src/components/ui/<component>.tsx
```

The second step rewrites the generated import so the project uses its own
`cn` helper.

---

## Supabase

The client foundation is in `src/lib/supabase/`:

```ts
import { createClient } from "@/lib/supabase";           // browser
import { createServerClient } from "@/lib/supabase";      // server
```

Copy `.env.example` to `.env.local` and fill in the URL and anon key from
**Supabase Dashboard → Project Settings → API**.

Only the publishable/anon key ever goes in `NEXT_PUBLIC_*`. The service-role
key must not be used in the browser or committed. Access control is enforced by
Row Level Security policies, not by hiding the key.

No tables, policies or auth flows exist yet — that is Phase 2.

---

## Validation

Zod schemas live in `src/lib/validations/`, separate from the UI:

- `common.ts` — reusable field builders (`requiredText`, `requiredParagraph`, `phoneNumber`)
- `complaint.ts` — derives select options from the domain constants, and
  composes them into `complaintDraftSchema`

`src/components/forms/complaint-form.tsx` wires the schema to React Hook Form
via `zodResolver`. Submitting validates and stops there — persistence is Phase 2.

---

## Charts

`src/components/dashboard/charts.tsx` holds the Recharts wrappers (trend area,
stacked area, bar, line, donut) plus a shared `ChartFrame` and tooltip. They
are `"use client"` and receive plain data from Server Components.

Sample series are in `src/lib/mock/analytics.ts`, and every chart panel carries
a note saying the values are illustrative.

---

## Accessibility

- Semantic landmarks, heading order and real `<table>` markup with captions
- Visible focus rings via a global `:focus-visible` rule
- `aria-current="page"` on the active navigation item, `aria-live` on result counts
- Every chart is paired with text; `ResponsiveContainer` keeps charts resizable
- Inputs have labels; errors are wired with `aria-invalid` / `aria-describedby`
- Colour is never the only signal — badges carry a dot and a text label

---

## Deferred to Phase 2

- Supabase schema, migrations and Row Level Security policies
- Supabase Auth: sign-up, sign-in, sessions, role enforcement
- Real complaint create / read / update, and Supabase Storage for evidence
- Priority scoring, duplicate detection, notification and email
- Live analytics, and replacing `src/lib/mock/` with queries
