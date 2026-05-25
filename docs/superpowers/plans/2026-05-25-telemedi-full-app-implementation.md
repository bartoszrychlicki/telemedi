# Telemedi Full App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the desktop Telemedi occupational-medicine portal from the Polish Handoff Squad Design, with correct role boundaries, seeded demo data, local browser verification, Vercel deployment, and a committed final state.

**Architecture:** Keep Next.js App Router API routes as the stable backend surface, then build typed React client views on top of those endpoints. Split authorization into admin read-only/admin management and tenant portal contexts so `SUPER_ADMIN` cannot mutate client workspace data while still being able to inspect company details and download referral PDFs.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Better Auth, Prisma, Neon Postgres, `@react-pdf/renderer`, `exceljs`, Vercel.

---

## File Map

- `src/lib/auth-context.ts`: split auth helpers into admin, portal, and admin company read contexts.
- `src/server/admin-service.ts`: add read-only company detail/dashboard access for Telemedi admin.
- `src/server/company-service.ts`: add company settings/profile read/write service for coordinator settings and PDF defaults.
- `src/server/dashboard-service.ts`: aggregate dashboard cards, deadline lists, and status counts.
- `src/server/referral-service.ts`: keep portal mutation APIs tenant scoped; expose admin read-only referral lookup for PDF download.
- `src/server/schemas.ts`: add company settings and dashboard/admin query schemas.
- `src/app/api/**`: add missing API routes and tighten existing route guards.
- `prisma/schema.prisma` and migration: add persisted company PDF/signature settings fields.
- `prisma/seed.ts`: replace tiny `Demo Wedel` seed with richer PZM demo data matching the handoff.
- `src/app/(auth)/login/page.tsx`: production login UI.
- `src/app/admin/**`: Telemedi admin desktop UI.
- `src/app/portal/**`: HR portal routes for dashboard, employees, referrals, hazards, templates, and settings.
- `src/components/**`: shared shell, buttons, inputs, tables, modals, badges, and feature widgets.
- `src/app/globals.css`: design tokens from the handoff, IBM Plex Sans, desktop-first layout rules.
- `docs/backend-contract.md`: update role and PDF access contract.
- Tests under `src/**/*.test.ts` plus browser-harness smoke scripts run manually.

## Execution Tasks

### Task 1: Authorization Boundary

- [ ] Add `requirePortalContext()` that accepts only `COORDINATOR` and `HR_STAFF`.
- [ ] Keep `requireAdmin()` for `SUPER_ADMIN`.
- [ ] Add `requireAdminCompanyReadContext(request, companyId)` for admin read-only views.
- [ ] Replace portal mutation/list routes currently using `requireCompanyContext()` with `requirePortalContext()`.
- [ ] Allow `SUPER_ADMIN` PDF download only through an admin-safe route or branch that does not enable broader portal mutation access.
- [ ] Update tests proving:
  - `SUPER_ADMIN` cannot create employees, create hazards, create templates, or create referrals.
  - `SUPER_ADMIN` can list companies and download referral PDFs.
  - `COORDINATOR` and `HR_STAFF` keep their intended portal access.

### Task 2: Backend Gaps

- [ ] Add company settings persistence for PDF defaults: issued place, signatory name, signatory title, optional footer note.
- [ ] Add coordinator-only invitation endpoint for HR users in the company settings screen.
- [ ] Add dashboard aggregation endpoint for counts, urgent referrals, recent referrals, and expiring deadlines.
- [ ] Add admin company detail endpoint with company data, users, counts, and recent referrals.
- [ ] Update `docs/backend-contract.md` with exact route behavior and role access.

### Task 3: Demo Data

- [ ] Replace the current small demo company with `Polskie Zakłady Mechaniczne sp. z o.o.` / `PZM Polska` from the handoff.
- [ ] Seed 15 employees, system/company hazards, 4 templates, and representative referrals across `SUBMITTED`, `SCHEDULED`, `COMPLETED`, `CLOSED`, and `DRAFT`.
- [ ] Keep demo credentials stable:
  - `admin@telemedi.pl`
  - `koordynator@demo.pl`
  - `hr@demo.pl`
- [ ] Ensure seed is idempotent against Neon.

### Task 4: Desktop Frontend

- [ ] Implement the auth-aware landing redirect and login screen.
- [ ] Build the portal shell with collapsible sidebar and desktop layout only.
- [ ] Build dashboard, employees, referrals list, referral wizard, referral detail, hazards, templates, and settings from the handoff.
- [ ] Build Telemedi admin panel with company creation, coordinator invite, company read-only detail, users, recent referrals, and PDF download where relevant.
- [ ] Keep Telemedi-side status management mocked in the referral detail developer panel, as requested.
- [ ] Do not implement mobile-specific navigation or layouts in this phase.

### Task 5: Local Verification

- [ ] Run `npm run db:validate`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Start local Next.js and verify in browser-harness:
  - login as `SUPER_ADMIN`, add company, create coordinator invite, open company read-only detail, download referral PDF, confirm mutation controls are absent/blocked.
  - login as `COORDINATOR`, manage employees, import XLS template path, create referral, update mocked status, manage hazards/templates/settings, invite HR.
  - login as `HR_STAFF`, use operational portal screens, confirm settings/invite controls are hidden/blocked.

### Task 6: Vercel Deployment

- [ ] Verify Vercel project link and env vars.
- [ ] Set or update required Vercel env vars without printing secrets.
- [ ] Run Prisma deploy against Neon.
- [ ] Run seed against Neon.
- [ ] Deploy to Vercel.
- [ ] Browser-verify the deployed URL for all three demo roles.

### Task 7: Commit and Report

- [ ] Review `git status` and keep unrelated `.superpowers/**` artifacts out of the app commit unless required.
- [ ] Commit the implemented application, docs, seed, migrations, tests, and config.
- [ ] Return a concise report with:
  - Vercel URL,
  - test commands and result,
  - browser smoke matrix by role,
  - seed credentials,
  - any known non-blocking limitations.

## Self-Review

- The plan preserves the user-specified role boundary: `SUPER_ADMIN` can add clients and inspect data, cannot mutate client HR workflows, and can download referral PDFs.
- The plan explicitly excludes mobile implementation and production Telemedi status management.
- Every required final deliverable is represented: implementation, local browser testing, Vercel deployment, seed data, browser verification, commit, and final report.
