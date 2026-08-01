# EventPass — Backend

Node.js / Express / TypeScript / MongoDB (Mongoose) implementation of the EventPass API, built directly from
`EventPass-Implementation-Plan.md` (API Specification §1 and Database Design §2).

## Stack
Express 4, TypeScript, Mongoose 8, Zod (validation), JWT auth, bcrypt, Multer (CSV upload), fast-csv,
`qrcode` (QR generation), `archiver` (ZIP export), ExcelJS (CSV/XLSX reports), Pino (logging).

## Setup

```bash
npm install
cp .env.example .env   # then edit MONGO_URI, JWT secrets, etc.
npm run dev             # starts on http://localhost:4000 with nodemon + ts-node
```

Requires a running MongoDB instance (local or Atlas) — set `MONGO_URI` accordingly.

Build & run in production:
```bash
npm run build
npm start
```

## Project structure

```
src/
  config/         env loading, MongoDB connection
  models/         9 Mongoose schemas (User, Event, EventConfig, Category, Guest,
                  FormSchema, FormResponse, CheckinLog, AuditLog) — matches DB Design §2.3
  middleware/     JWT auth, role-based access, field-level guest projection (§1.3),
                  Zod validation, rate limiters (§1.7), central error handler
  validators/     Zod request schemas per resource
  controllers/    Business logic per resource (auth, events, categories, guests,
                  dynamic form, public invitation, check-in, dashboard, reports)
  routes/         Express routers wired to match the API spec's exact paths
  utils/          JWT signing, invitation/QR token generation, QR image generation,
                  CSV parsing, pagination helpers, standard response envelope
  types/          Express Request augmentation (req.user)
  app.ts          Express app assembly (middleware, routes, error handling)
  server.ts       Entry point — connects DB, starts HTTP server
```

## What's implemented

- **Auth**: register, login, refresh (rotating httpOnly cookie), me, logout, Security-staff
  provisioning by an Organizer (spec §1.5).
- **Events**: full CRUD, config (module/workflow) updates with workflow-vs-module consistency
  guard, branding updates, soft-delete (archive only, per DB design §2.5).
- **Categories**: CRUD, blocked delete when guests are still assigned (409).
- **Guests**: CRUD, bulk reassign/delete, CSV import (partial success, duplicate-by-email
  detection, per-row error reporting — spec §1.6), CSV/XLSX export, single & bulk ZIP QR
  download, approval flow (Flow 4).
- **Field-level access control**: Security role never receives email/phone/notes/invitationToken
  on any guest-related response (spec §1.3), enforced centrally via `guestFieldProjection` middleware.
- **Public invitation flow**: fetch by token, RSVP submission (mode-aware, deadline-aware),
  dynamic form submission (required-field + option validation, one submission per guest).
- **Dynamic Form Builder**: get/replace schema, list responses.
- **QR Check-in**: scan (camera token), manual check-in, guest search, recent check-ins feed,
  duplicate-scan detection (409), closed-event guard (410).
- **Dashboard & Reports**: summary cards, attendance trend, RSVP distribution, live check-ins,
  paginated attendance/RSVP reports, CSV/XLSX export (capped at 20,000 rows).
- **Rate limiting** per route group exactly as specified (§1.7).
- **Audit logging** (fire-and-forget) on event/config/guest-import mutations.

## What's stubbed / left for you

- File storage for banner/logo/cover images: fields exist on the model, but there's no upload
  endpoint wired up yet — wire in S3/Cloudinary/local disk multer upload as needed.
- Email/WhatsApp sending for invitations (marked "future" in the PRD).
- Automated tests.
- The `scripts/migrations/` folder described in the DB design doc (§2.6) — no migrations exist
  yet since the schema hasn't changed post-launch.
- Seed script for demo data.

## Notes on design choices

- Every controller enforces ownership (`getOwnedEvent` in `event.controller.ts`) before touching
  any event-scoped resource, so Organizer A can never read/write Organizer B's data even with a
  guessed ID.
- QR tokens never encode guest data — only the random token string goes into the QR image
  (`utils/qr.ts`), matching PRD §13's security requirement.
- `FormResponse.answers` is a Mongoose `Map`, so adding/removing dynamic form fields never
  requires a schema migration (DB design §2.6).
