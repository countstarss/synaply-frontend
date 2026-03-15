# TuneAdmin Marketplace UI Template

A business-neutral admin UI starter built with Next.js 15 + Tailwind CSS.

This repo has been deeply cleaned for marketplace use:
- Removed legacy business modules (mail, issue, workflow, team, chat, docs integrations)
- Kept only generic template routes and reusable UI architecture
- Added a configurable dashboard system where metrics/widgets can be hidden, added, and recomposed

## Route Map

- `/landing` - marketplace presentation page
- `/dashboard`
- `/customers`
- `/orders`
- `/analytics`
- `/content`
- `/settings`
- `/settings/dashboard`
- `/settings/profile`
- `/settings/workspace`
- `/settings/members`
- `/settings/[section]`
- `/auth` - presentation-only auth shell

## Dashboard Kit (Business-Ready)

`src/components/dashboard-kit/` now includes:
- `DashboardPageHeader`
- `DashboardMetricGrid`
- `DashboardRecordsTable`
- `DashboardActionBoard`
- `DashboardActivityFeed`
- `FilterBar`
- `SegmentSwitch`
- `EmptyState`
- `StatusPill`
- `TimelinePanel`
- `CommandPalette`

## Configurable Dashboard Philosophy

Dashboard preferences are persisted in local storage via:
- `src/stores/dashboard-preferences.ts`

Users can:
- Hide/show base metrics
- Add custom metrics (value, trend, tone, formula)
- Toggle timeline and action board visibility
- Switch default segment/timeframe behavior

The full example orchestration is in:
- `src/components/template/DashboardWorkbench.tsx`

## Settings UI (Refined)

Settings pages are no longer placeholders. They include practical form scaffolding for:
- platform defaults
- profile editing
- workspace policies
- member role management
- dashboard preference management

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Radix UI primitives
- Framer Motion
- Zustand

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## How To Build Your Product On Top

1. Replace `template-data.ts` mock data with your real domain schema.
2. Keep `dashboard-kit` as your base UI language and add business variants.
3. Wire CTA buttons and commands to real backend operations.
4. Move local-store preferences to your persistence layer when ready.

## Quality Status

- `pnpm lint` passes with zero warnings
- `pnpm build` passes
