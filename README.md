# MedVault Medical Report Portal

A production-structured medical report management SaaS built with Next.js 15, TypeScript, MongoDB and secure HTTP-only JWT sessions. Administrators manage patients and PDF reports; patients open a no-login verification page through a unique URL or QR code.

## Included

- Premium responsive dashboard, patient management and report history
- Atomic PDF upload → annual sequential UID → secure URL → PNG/SVG QR generation
- `pdf-lib` processing that embeds the QR on page one while preserving the original PDF
- Configurable corner/custom QR placement, size and margin with before/after previews
- Private administrator access to both PDF versions; public delivery always serves the QR-embedded version
- JWT authentication, middleware route protection and `super_admin` / `admin` / `staff` RBAC
- Activity logs for login, patient/report changes and patient downloads
- Monthly analytics, top viewed/downloaded reports and storage usage
- Lab profile, logo, report URL prefix and theme settings
- Indexed Mongoose models, Zod validation, loading/error states and toast feedback
- Local storage adapter designed to be replaced by an S3 implementation
- Multi-stage Docker image and MongoDB Compose stack

## Local setup

Requirements: Node.js 22+, npm and MongoDB 7+.

```bash
cp .env.example .env.local
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The seed credentials come from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in your environment. Change the seeded password before exposing the application.

Use a random secret of at least 32 characters for `JWT_SECRET`:

```bash
openssl rand -base64 48
```

## Docker

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec app npm run seed
```

The Compose file persists MongoDB data and uploaded PDFs/QR images in named volumes. Put a TLS reverse proxy in front of the application in production and set `NEXT_PUBLIC_APP_URL` and the Settings page report prefix to the public HTTPS origin.

## API surface

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Patients | `GET/POST /api/patients`, `GET/PUT/DELETE /api/patients/:id` |
| Reports | `GET /api/reports`, `POST /api/reports/upload`, `GET/PUT/DELETE /api/reports/:id`, `GET/POST /api/reports/:id/qr`, `POST /api/reports/regenerate-qr` |
| Operations | `GET /api/analytics`, `GET /api/activity`, `GET/PUT /api/settings`, `GET /api/search` |
| Public | `GET /report?id=:uid`, `GET /api/report/public?id=:uid`, `GET /api/report/public?id=:uid&file=1` |

PDF files are intentionally not exposed as ordinary static assets. Original and QR-embedded files have separate private storage keys. Authenticated routes can access either version, while public routes validate the printed alphanumeric report UID and only read the embedded-PDF key.

## PDF and QR processing

The upload route uses the native Next.js `FormData` parser, validates the PDF and then:

1. Detects the UID printed on page one with OCR and validates the administrator-confirmed value.
2. Builds the canonical `/report?id=UID` URL from the configurable domain prefix.
3. Generates high-resolution PNG and scalable SVG QR assets.
4. Loads the original with `pdf-lib` and draws the PNG on the first page.
5. Saves `reports/original/UID.pdf` and `reports/embedded/UID.pdf` separately.
6. Commits the report record only after all processing succeeds.

When a PDF is selected, the protected `/api/reports/extract-uid` endpoint renders page one with Poppler and uses Tesseract OCR to auto-fill text following `UID:`. The detected value remains editable and should be visually confirmed before upload. The upload API runs the same OCR as a fallback when no UID is supplied. Docker includes both OCR runtime packages.

Regeneration always reads the untouched original and applies the latest QR settings, preventing stacked QR images. The Settings page supports the template-specific **CNS / Psychiatry box** preset, all four corners, custom X/Y coordinates, size and margin.

## Architecture

```text
app/                 Next.js pages, layouts and REST route handlers
components/          Reusable UI, dashboard and layout components
features/            Domain-specific client forms and managers
lib/                 Auth, database, validation and API utilities
models/              Indexed Mongoose schemas
services/            Storage, UID/QR and activity services
types/               Shared TypeScript contracts
scripts/             Database seed utility
public/uploads/      Local report, QR and branding persistence
```

## S3 migration

Implement the `StorageAdapter` interface in `services/storage.service.ts` with AWS SDK methods (`PutObject`, `GetObject`, `DeleteObject`) and export that adapter instead of `LocalStorageAdapter`. Report creation and delivery code requires no structural changes. For private medical documents, use a private bucket, server-side encryption, lifecycle policies and short-lived signed access only through authenticated routes.

## Production checklist

- Use TLS, a long JWT secret and managed MongoDB with backups.
- Mount durable storage or switch to private S3 before horizontal scaling.
- Add organization/tenant IDs to every model before offering multi-tenant accounts.
- Add malware scanning and PDF content inspection for untrusted uploads.
- Configure request rate limiting and centralized audit-log retention at the edge.
- Review local healthcare privacy, retention and consent requirements before handling real patient data.
