# Vacation Manager

## Overview

An internal HR tool for managing employee vacation requests. Built as a full-stack monorepo with two separate web portals and a REST API:

- **Requester Portal** — employees submit and track their own vacation requests
- **Validator Portal** — managers review, approve, and reject requests from their team

Both portals share types from a common library and communicate with the same Express API backed by PostgreSQL.

---

## Live Demo

- Requester Portal: [URL]
- Validator Portal: [URL]
- API: [URL]

> **Note:** The first request to the API may take ~30 seconds to respond (Render free tier cold start).

**To try it yourself — no invite needed:**
- Go to the **Requester Portal** → Sign Up → you are registered as an employee
- Go to the **Validator Portal** → Sign Up → you are registered as a manager

Role is determined by which portal you register on — there is no role dropdown.

---

## Tech Stack

| Technology | Why it was chosen |
|---|---|
| **NX monorepo** | Shared types via `libs/shared`, single `pnpm install`, run all three apps with one command |
| **Vue 3 + Composition API** | Modern reactive framework with `<script setup>` syntax and TypeScript-first ergonomics |
| **PrimeVue 4 (Aura theme)** | Enterprise-grade UI library matching the admin dashboard brief; better DataTable than Vuetify |
| **Vue Router** | Client-side routing with navigation guards for auth-protected pages |
| **vue-i18n** | EN/FR localisation for the French company context; language persisted to `localStorage` |
| **Axios** | HTTP client with request interceptors for automatic JWT injection |
| **Node.js + Express** | Lightweight REST API server; minimal boilerplate, well-understood in the ecosystem |
| **TypeORM** | TypeScript-native ORM with decorator-based entity definitions; migrations via `synchronize` in dev |
| **PostgreSQL** | Relational database with native enum types and UUID primary keys |
| **Zod** | TypeScript-native validation — the schema IS the type, no duplication |
| **bcryptjs** | Secure password hashing; pure JS, no native bindings required |
| **jsonwebtoken** | JWT authentication; stateless, no session store needed |
| **Anthropic Claude API** | Context-aware AI HR assistant; injected with the user's actual request data as system prompt context |
| **Vitest** | Unit testing; zero-config with Vite, same transform pipeline as the app |

---

## Project Structure

```
vacation-manager/
├── apps/
│   ├── requester-portal/          # Vue 3 SPA for employees
│   │   └── src/
│   │       ├── app/               # Root App.vue and global styles
│   │       ├── components/        # Reusable UI components (nav, sidebar, cards, chat)
│   │       ├── composables/       # useVacations — data fetching, filtering, polling
│   │       ├── i18n/              # EN and FR translation files
│   │       ├── router/            # Vue Router config with auth guards
│   │       ├── services/          # Axios instance with JWT interceptor
│   │       ├── stores/            # authStore — user session, token persistence
│   │       ├── utils/             # formatters (dates, status severity, day count)
│   │       └── views/             # LoginView, RegisterView, DashboardView
│   │
│   ├── validator-portal/          # Vue 3 SPA for managers
│   │   └── src/
│   │       ├── app/               # Root App.vue and global styles
│   │       ├── components/        # RequestCard, RequestTable, BulkActionBar, RejectDialog, ChatWidget
│   │       ├── composables/       # useRequests — fetching, filtering, bulk actions, polling
│   │       ├── i18n/              # EN and FR translation files
│   │       ├── router/            # Vue Router config with auth guards
│   │       ├── services/          # Axios instance with JWT interceptor
│   │       ├── stores/            # authStore — user session, token persistence
│   │       ├── utils/             # formatters (shared logic, duplicated from requester)
│   │       └── views/             # LoginView, RegisterView, DashboardView
│   │
│   └── server/                    # Express REST API
│       └── src/
│           ├── config/            # TypeORM AppDataSource (database connection)
│           ├── controllers/       # Request handlers — auth, requests, chat
│           ├── entities/          # TypeORM entities: User, VacationRequest
│           ├── middleware/        # auth guards, Zod validation, error handler, schemas
│           ├── routes/            # Express routers: authRoutes, requestRoutes, chatRoutes
│           └── services/          # Business logic: authService, requestService
│
├── libs/
│   └── shared/                    # Shared TypeScript types imported by all three apps
│       └── src/lib/shared.ts      # UserRole, RequestStatus, VacationRequest, DTOs, ApiResponse
│
├── nx.json                        # NX workspace config
├── pnpm-workspace.yaml            # pnpm workspaces declaration
├── tsconfig.base.json             # Base TypeScript paths (maps @org/shared → libs/shared)
└── package.json                   # Root dev dependencies (NX, TypeScript, Prettier)
```

---

## Getting Started

### Prerequisites

- Node.js v22+
- PostgreSQL 14+
- pnpm 9+

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd vacation-manager

# 2. Install all dependencies (all three apps + shared lib)
pnpm install

# 3. Create the PostgreSQL database
psql postgres -c "CREATE DATABASE vacation_manager"

# 4. Copy environment files and fill in values (see Environment Variables below)
cp apps/server/.env.example apps/server/.env
cp apps/requester-portal/.env.example apps/requester-portal/.env
cp apps/validator-portal/.env.example apps/validator-portal/.env

# 5. Start all three apps simultaneously
pnpm nx run-many -t serve

# Or start individually:
pnpm nx serve server            # API on http://localhost:3000
pnpm nx serve requester-portal  # Requester portal on http://localhost:4200
pnpm nx serve validator-portal  # Validator portal on http://localhost:4201
```

### Environment Variables

**`apps/server/.env`**

```env
# Server
PORT=3000                        # Port the Express server listens on
NODE_ENV=development             # 'development' enables TypeORM synchronize

# Database — PostgreSQL connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vacation_manager
DB_USER=your_postgres_username   # Usually your macOS username in local dev
DB_PASS=                         # Leave blank if no password set

# JWT — used to sign and verify authentication tokens
# Generate a long random string — never commit the real value
JWT_SECRET=change_me_to_a_long_random_secret

# Email (optional — set EMAIL_ENABLED=false to skip)
EMAIL_ENABLED=false
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=                       # Mailtrap credentials
SMTP_PASS=

# AI — Anthropic API key for the HR assistant chatbot
ANTHROPIC_KEY=sk-ant-...         # Get from console.anthropic.com
```

**`apps/requester-portal/.env`** and **`apps/validator-portal/.env`**

```env
VITE_API_URL=http://localhost:3000   # Base URL of the Express API
```

---

## API Documentation

Base URL: `http://localhost:3000`

All protected endpoints require the header:
```
Authorization: Bearer <jwt_token>
```

All error responses follow the shape:
```json
{
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human readable message",
    "field": "fieldName"
  }
}
```

---

### `GET /health`

Health check — no auth required.

**Response `200`**
```json
{ "status": "ok", "timestamp": "2026-05-10T12:00:00.000Z" }
```

---

### `POST /api/v1/auth/register`

Register a new account. Role is set by the frontend — the requester portal sends `"Requester"`, the validator portal sends `"Validator"`.

**Request body**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepassword",
  "role": "Requester"
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | min 2 characters |
| `email` | string | valid email format |
| `password` | string | min 8 characters |
| `role` | `"Requester"` \| `"Validator"` | set by the portal |

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "Requester"
  }
}
```

---

### `POST /api/v1/auth/login`

Authenticate and receive a JWT.

**Request body**
```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Response `200`**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "Requester"
    }
  }
}
```

---

### `GET /api/v1/requests`

Get all vacation requests. **Validator role required.**

Optional query params:
- `?status=Pending` — filter by status (`Pending`, `Approved`, `Rejected`)

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "user": { "id": "uuid", "name": "Jane Smith", "email": "jane@example.com", "role": "Requester" },
      "startDate": "2026-07-01",
      "endDate": "2026-07-05",
      "reason": "Summer holiday",
      "status": "Pending",
      "comments": null,
      "createdAt": "2026-05-10T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### `GET /api/v1/users/:id/requests`

Get vacation requests for a specific user. **Requester role required.**

- `:id` — the UUID of the authenticated user

Optional query params:
- `?status=Approved` — filter by status

**Response `200`** — same shape as `GET /requests` but scoped to one user.

---

### `POST /api/v1/requests`

Submit a new vacation request. **Requester role required.**

**Request body**
```json
{
  "userId": "uuid",
  "startDate": "2026-07-01",
  "endDate": "2026-07-05",
  "reason": "Summer holiday"
}
```

| Field | Type | Rules |
|---|---|---|
| `userId` | UUID string | must match authenticated user |
| `startDate` | `YYYY-MM-DD` string | must not be in the past |
| `endDate` | `YYYY-MM-DD` string | must be on or after `startDate` |
| `reason` | string | optional, max 500 characters |

**Response `201`** — the created `VacationRequest` object under `data`.

**Error `409`** — date conflict with an existing pending or approved request.

---

### `PATCH /api/v1/requests/:id`

Approve or reject a request. **Validator role required.**

- `:id` — UUID of the vacation request

**Request body**
```json
{
  "status": "Approved",
  "comments": ""
}
```

or to reject:
```json
{
  "status": "Rejected",
  "comments": "Conflicts with team deadline"
}
```

| Field | Type | Rules |
|---|---|---|
| `status` | `"Approved"` \| `"Rejected"` | required |
| `comments` | string | required when `status` is `"Rejected"`, max 1000 characters |

**Response `200`** — the updated `VacationRequest` object under `data`.

---

### `POST /api/v1/chat`

Send a message to the AI HR assistant. **Auth required (any role).**

The server injects the user's actual vacation data as system prompt context. The assistant responds in the language specified.

**Request body**
```json
{
  "userId": "uuid",
  "language": "en",
  "messages": [
    { "role": "user", "content": "How many days off do I have approved?" }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `userId` | UUID string | used to fetch request context |
| `language` | `"en"` \| `"fr"` | controls the response language |
| `messages` | `{ role, content }[]` | full conversation history |

**Response `200`**
```json
{ "reply": "You have 5 approved days off: July 1–5." }
```

---

## Architecture Decisions

### Why NX Monorepo

All three apps live in one repository with a single `pnpm install`. The `libs/shared` package exports TypeScript interfaces and enums (`UserRole`, `RequestStatus`, `VacationRequest`, DTOs) that are imported by both portals and the server via the path alias `@org/shared`. When a type changes, TypeScript errors appear across all three apps simultaneously — no sync drift between frontend and backend contracts.

If the monorepo were ever split into separate repositories, `libs/shared` should be published as a private npm package to preserve this single source of truth.

### Why Two Separate Portals

Security through separation. A user's role is determined by which portal they registered on — there is no "switch role" dropdown or user-editable role field. A requester who navigates to the validator portal URL will hit a login screen for a different app; their token's role claim won't pass the `requireRole(UserRole.VALIDATOR)` guard. The wrong portal simply doesn't exist for the wrong user.

A single app with a role toggle would mean shipping all validator UI code to every employee's browser, and trusting the frontend to hide it correctly.

### Why PrimeVue over Vuetify

PrimeVue targets enterprise/admin tooling — dense data tables, complex form controls, DataTable with sorting and selection out of the box. Vuetify is excellent for consumer apps with Material Design. Given the brief referenced Inspinia UI (an admin template), PrimeVue's Aura theme was the closer match. PrimeVue's `DataTable` component also handles selection state and column configuration more cleanly than Vuetify's equivalent.

### Why UUID over Integer IDs

Sequential integer IDs leak information: an attacker can enumerate resources by incrementing the ID in the URL (`/requests/1`, `/requests/2`, ...) and discover how many records exist. UUIDs are non-sequential and non-guessable. The tradeoff is slightly larger storage and index size, and UUIDs are less readable in logs — acceptable for an HR tool where privacy outweighs convenience.

### Why PATCH for Approve/Reject

`PATCH /requests/:id` is the RESTful way to partially update an existing resource. The vacation request resource already exists; approving or rejecting it changes its `status` and `comments` fields — a partial update, not a new resource creation. An action-based endpoint like `POST /requests/:id/approve` works but breaks REST conventions — the verb is in the URL rather than the HTTP method.

### Shared Types Library (`libs/shared`)

`libs/shared/src/lib/shared.ts` is the single source of truth for all data contracts:
- `UserRole` and `RequestStatus` enums — used in guards, validation schemas, and UI
- `VacationRequest` and `User` interfaces — used in TypeORM entities, API responses, and Vue component props
- `CreateRequestDto` and `UpdateRequestDto` — sent from frontend to backend
- `ApiResponse<T>` and `ApiError` — envelope shapes every API response uses

**Future improvement:** If the apps split into separate repos, `libs/shared` should be published as a private npm package. If non-TypeScript consumers need to call the API, an OpenAPI spec would generate types for any language — currently the contract is TypeScript-only.

### Date Conflict Detection

The overlap query uses a single SQL condition that covers all four ways two date ranges can overlap:

```
existingStart <= newEnd AND existingEnd >= newStart
```

This catches: new range inside existing, existing range inside new, partial overlap on either side. Only `Pending` and `Approved` requests are checked — a `Rejected` request doesn't block future bookings for the same dates.

---

## Features

### Core Features

- Submit vacation requests with date range selection and optional reason
- View personal request history with status tracking (Pending / Approved / Rejected)
- Approve or reject requests — rejection requires a mandatory comment
- Role-based access control — requesters and validators are fully separated at the API level

### Bonus Features

- **Context-aware AI HR assistant** (Anthropic Claude API) — the chatbot is injected with the user's actual request data; a requester sees their own history, a validator sees the full team's. Responds in the selected language.
- **EN/FR localisation** — all UI strings are translated; language toggle persists to `localStorage`
- **Real-time polling** — both portals poll for updates every 30 seconds; polling stops when the tab is backgrounded and resumes on focus
- **Date conflict detection** — the server rejects requests that overlap an existing pending or approved request for the same user
- **Mobile responsive** — filter chips instead of a sidebar drawer on mobile, stacked card layout, search and sort moved into the filter row
- **Card and table view** — validators can switch between card and table layouts; preference is persisted to `localStorage`
- **Bulk approve / reject** — select multiple requests and act on them in one click; bulk reject is restricted to requests from the same employee (a validator cannot reject requests from multiple employees in one action — different rejection reasons are expected)

---

## Edge Cases Handled

| Scenario | How it's handled |
|---|---|
| End date before start date | Zod schema `refine` — rejected before hitting the service |
| Start date in the past | Zod schema `refine` — rejected before hitting the service |
| Date conflict with existing request | Service-layer query — returns `409 DATE_CONFLICT` |
| Rejection without a comment | Zod schema `refine` — `comments` required when `status === "Rejected"` |
| Approving an already-approved request | Service-layer status transition guard — returns `409 INVALID_STATUS_TRANSITION` |
| Double submit | Submit button disabled and set to loading state while request is in flight |
| Empty states | All list views render a dedicated empty state illustration |
| Network errors | Axios error handler shows a toast; composables expose `loading` and reset it on failure |
| Token expiry | 401 response interceptor clears auth and redirects to login |

---

## Testing

### Run Tests

```bash
# Server — auth service, request service, validation middleware, auth middleware
pnpm nx run @org/server:test

# Requester portal — useVacations composable, formatter utils
pnpm nx run @org/requester-portal:test

# Run both
pnpm nx run-many -t test
```

### What's Covered

**Server (4 test files, ~27 tests)**
- `authService.test.ts` — register (success, duplicate email), login (success, user not found, wrong password)
- `requestService.test.ts` — getAllRequests, getUserRequests, createRequest (success, conflict), updateRequest (approve, reject, invalid transition)
- `validate.test.ts` — valid body passes, coercion works, Zod error → AppError 400, non-Zod errors forwarded
- `auth.test.ts` — missing header → 401, wrong format → 401, valid token → sets req.user, requireRole matching and mismatch

**Requester Portal (2 test files, ~22 tests)**
- `useVacations.test.ts` — fetchRequests, submitRequest, filteredRequests (all filters and sort modes), stats computed, polling lifecycle (starts, stops, auto-cleanup on unmount)
- `formatters.test.ts` — getStatusSeverity (all 3 statuses), formatDate, getDayCount (same day, multi-day, month-crossing, full week)

All tests mock database access and HTTP calls — no real database or API is hit.

---

## Known Limitations & Future Improvements

- **Pagination not implemented** — all requests are returned in a single response. For large datasets, `limit` and `offset` query params would be added and the frontend updated to page through results.
- **Weekend-aware day counting** — the day counter currently counts all calendar days including weekends. A production system would exclude non-working days based on a company calendar.
- **No department or team management** — requests are global. A production system would scope visibility to the manager's direct reports.
- **Drag and drop Kanban** — designed and scoped but not implemented due to time constraints.
- **Dark mode** — designed but descoped due to PrimeVue theming complexity. Planned for the next iteration.
- **Email notifications** — architecture is ready (Mailtrap + Nodemailer wired into the env config) but the sending logic was not implemented due to time constraints. The `EMAIL_ENABLED` flag is already in place.
- **Shared formatter utils** — `utils/formatters.ts` is duplicated between both portals. Moving it to `libs/shared` would make it a true single source of truth.
- **OpenAPI spec** — the API contract is currently enforced through shared TypeScript types. An OpenAPI spec would enable code generation for non-TypeScript consumers and serve as living documentation.
- **`libs/shared` as npm package** — if the monorepo splits into separate repositories, `libs/shared` should be published as a private npm package.
- **Race condition on simultaneous approvals** — if two validators approve the same request at the same moment, the status transition guard may not catch it cleanly. A database-level transaction with a `SELECT FOR UPDATE` lock would make this airtight.

---

## Git & Version Control

Hosted on Bitbucket. Feature branch workflow — all changes developed on a feature branch and merged to `main` via pull request.
