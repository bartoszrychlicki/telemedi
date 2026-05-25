# Telemedi Medycyna Pracy

Next.js full-stack Telemedi occupational-medicine referrals portal, based on the
Polish Handoff Squad desktop design.

## Stack

- Next.js 16 App Router + REST Route Handlers
- Better Auth + organizations plugin
- Prisma 7 + Neon Postgres
- React 19 + Tailwind CSS 4
- PDF: `@react-pdf/renderer`
- XLSX: `exceljs`
- Tests: Vitest, Playwright-ready

## Environment

Copy `.env.example` to `.env.local` and fill real Neon/Vercel values:

```bash
DATABASE_URL="pooled Neon connection string"
DIRECT_URL="direct Neon connection string"
BETTER_AUTH_SECRET="32+ random characters"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Use `DATABASE_URL` for the pooled runtime connection and `DIRECT_URL` for Prisma migrations.

## Local Development

```bash
npm install
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:seed
npm run dev
```

Demo accounts are configured in `.env.example`:

- `admin@telemedi.pl`
- `koordynator@demo.pl`
- `hr@demo.pl`

Default demo password: `TelemediDemo123!`

## Verification

```bash
npm run db:validate
npm run lint
npm run typecheck
npm test
npm run build
```

`npm audit --omit=dev` currently reports moderate upstream advisories in Prisma/Next dependencies where `audit fix --force` would downgrade major packages. The spreadsheet parser was changed from `xlsx` to `exceljs` to avoid a high-severity parser advisory.

## API Surface

- `GET /api/health`
- `GET /api/me`
- `GET /api/dashboard`
- `GET/POST /api/admin/companies`
- `GET /api/admin/companies/:id`
- `POST /api/admin/companies/:id/invitations`
- `GET /api/admin/companies/:id/referrals/:referralId/pdf`
- `GET/POST /api/admin/system-hazards`
- `PATCH/DELETE /api/admin/system-hazards/:id`
- `GET/PATCH /api/company/settings`
- `POST /api/company/invitations`
- `GET/POST /api/employees`
- `PATCH /api/employees/:id`
- `GET /api/employees/import-template`
- `POST /api/employees/import`
- `GET/POST /api/hazards`
- `PATCH/DELETE /api/hazards/:id`
- `GET/POST /api/templates`
- `PATCH/DELETE /api/templates/:id`
- `GET/POST /api/referrals`
- `GET /api/referrals/:id`
- `POST /api/referrals/:id/status`
- `GET /api/referrals/:id/pdf`

## Deployment Notes

Vercel needs these variables in Development, Preview, and Production:

- `DATABASE_URL`
- `DIRECT_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- optional demo seed values from `.env.example`

After setting envs:

```bash
npm run db:deploy
npm run db:seed
vercel --prod
```

For public demo URLs, Vercel Authentication / Deployment Protection must be
disabled or bypassed intentionally; otherwise the application login page is
hidden behind Vercel access control before Better Auth can run.
