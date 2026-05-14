# TrustDesk Vendor Risk

TrustDesk is a multi-tenant B2B SaaS platform for vendor risk operations, built with React + TypeScript + Tailwind (Vite), a Node.js API in `/server`, and Supabase for Auth + PostgreSQL.

## Local setup

1. Copy environment variables:
   - Copy `.env.example` to `.env` for frontend/backend shared local development.
2. Install dependencies:
   - `npm install`
   - `cd server && npm install`
3. Apply migrations in Supabase SQL editor in order:
   - `migrations/001_trustdesk_schema.sql`
   - `migrations/002_seed_safe_org_template.sql`
4. Run frontend:
   - `npm run dev`
5. Run backend:
   - `npm run server:dev`

## Auth and verification

- Supabase Auth is required.
- Email confirmation is enforced:
  - Frontend blocks unverified users at `/verify-email`.
  - Backend middleware rejects unverified sessions for `/api/*`.

## Core features

- Multi-tenant organizations + role-based access (`owner`, `admin`, `analyst`, `viewer`)
- Vendor register CRUD with search, filter, and sort
- Assessments and scoring workflow
- Remediation tasks with priority and status
- Dashboard analytics + audit activity feed
- Team invite workflow and profile settings
- Billing/subscription-ready tenant model
