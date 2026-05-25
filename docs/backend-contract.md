# Backend Contract

The React UI treats `/api/*` as the integration surface. JSON responses use:

```json
{ "ok": true, "data": {} }
```

Errors use:

```json
{ "ok": false, "code": "validation_error", "message": "..." }
```

## Role Boundaries

- `SUPER_ADMIN` uses `/admin` and `/api/admin/*`.
- `SUPER_ADMIN` can create companies, generate company invitations, inspect company details/users/recent referrals, and download referral PDFs through admin read-only routes.
- `SUPER_ADMIN` cannot use tenant portal mutation routes: employees, hazards, templates, referral creation, or portal status changes.
- `COORDINATOR` uses `/portal`, can manage company settings and invite `HR_STAFF`.
- `HR_STAFF` uses operational portal screens, without company settings or user invitations.

## Important Routes

- `GET /api/me`
- `GET /api/dashboard`
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
- `GET /api/referrals/:id/pdf`
- `POST /api/referrals/:id/status`
- `GET/PATCH /api/company/settings`
- `POST /api/company/invitations`
- `GET/POST /api/admin/companies`
- `GET /api/admin/companies/:id`
- `POST /api/admin/companies/:id/invitations`
- `GET /api/admin/companies/:id/referrals/:referralId/pdf`

Tenant scoping for portal actions is session-derived. Front-end code must not send `companyId` for portal actions. Admin read-only access uses company IDs only in `/api/admin/*` routes.

For referral PDF generation, the backend uses `Referral` snapshot fields only. Updating an employee later will not change historical PDFs.
