# DevMetrics

A self-hosted API testing and regression-analysis platform. Define reusable HTTP test suites, execute them against real endpoints, get deterministic findings on each run, diff two runs for regressions, and share a run publicly via a token link.

## Features

- **Reusable Tests** — save an ordered set of HTTP requests (method, URL, headers, body, timeout, expected status) once, run it repeatedly.
- **Live Runs** — trigger a Test and watch execution progress in real time.
- **Automatic findings** — every run is analyzed for errors, error bursts, duplicate requests, retry patterns, latency anomalies, and failed assertions, each graded by severity.
- **Run comparison** — diff two runs to see what changed.
- **Public sharing** — share a completed run via a read-only link, no account required to view.
- **Multi-tenant** — each account gets an isolated, auto-provisioned API key.
- **Project Insights** — error-rate and latency trend, plus flaky-endpoint detection, across every test in a project. FastAPI + pandas + D3. See [Insights service](#insights-service--insights-service).

**Repo layout:** monorepo — `devmetrics-dashboard` (frontend), `devmetrics-backend` (API + run engine), `insights-service` (FastAPI + pandas, powers Project Insights), root-level integration tests.

```
DevMetrics/
├── devmetrics-dashboard/   React + Vite frontend
├── devmetrics-backend/     Node/Express API + test-run engine
├── insights-service/       FastAPI + pandas — Project Insights
├── package.json             root-level Jest/Playwright integration tests
└── vercel.json               frontend deploy config
```

---

## Architecture

```
┌────────────────────────┐
│  devmetrics-dashboard  │  React 19 + Vite, Supabase auth, D3
└───────────┬────────────┘
            │ x-api-key
            ├──────────────────────┐
            ▼                      ▼
┌────────────────────────┐  ┌────────────────────────┐
│   devmetrics-backend   │  │    insights-service    │
│  Express, run engine   │◀─│   FastAPI + pandas     │
└───────────┬────────────┘  └────────────────────────┘
            │ pg (raw SQL, no ORM)
            ▼
┌────────────────────────┐
│  PostgreSQL (Supabase) │
└────────────────────────┘
```

The backend owns test execution, run lifecycle, finding analysis, and run comparison. The dashboard is a thin client over that API — it never talks to Postgres directly. `insights-service` is a read-only consumer of the same backend API, using the caller's own `x-api-key` — it holds no credential of its own and has no database access.

## Core workflow

```
Sign up (Supabase) → API key auto-provisioned
        │
        ▼
Create a Test (name + ordered HTTP requests: method, URL, headers, body, timeout, expected status)
        │
        ▼
Run it → backend executes each request server-side → queued → running → analyzing → completed/failed/cancelled
        │
        ▼
Run Detail: per-request results + severity-graded findings
        │
   ┌────┴──────┬─────────────┐
   ▼            ▼             ▼
Compare      Share          Project Insights
(two runs)   (public link)  (trend + flaky endpoints)
```

---

## Frontend — `devmetrics-dashboard`

**Stack:** React 19, Vite, React Router v7, Tailwind CSS v4, Supabase JS, Axios, Recharts, D3, lucide-react. No TypeScript.

```
src/
  pages/        route screens (Tests, TestDetails, Home, Sessiondetails, Compare, Api-key, Shared, ProjectSettings, ProjectInsightsPage, auth/)
  layouts/       AuthLayout — shell, bootstraps the per-user API key on first load
  components/    Sidebar, Navbar, RunRow, TestRow, MetricCard, ChartCard, ProjectInsights, ...
  components/ui/ Button, Badge, Card, Form, EmptyState, ErrorState, Pagination, Skeleton
  lib/           api.js, auth.js, projects.js, tests.js, runs.js, apiKeys.js, utils.js
  hooks/         useFetch, useTestEditor, useRunDetails
```

### Routes

| Route | Shell | Auth |
|---|---|---|
| `/login`, `/signup` | No | No |
| `/`, `/tests` | Yes | Yes |
| `/tests/:id` | Yes | Yes |
| `/sessions` | Yes | Yes |
| `/sessions/:id` | Yes | Yes |
| `/compare` | Yes | Yes |
| `/api-key` | Yes | Yes |
| `/projects/:id` | Yes | Yes |
| `/projects/:id/insights` | Yes | Yes |
| `/shared/:token` | No | No |

### Setup

```bash
cd devmetrics-dashboard
npm install
```

`.env`:
```
VITE_BACKEND_URL=http://localhost:5000
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_INSIGHTS_URL=http://localhost:8000
```

```bash
npm run dev
```

### Design system — Graphite Mono

Near-monochrome, light-only. Color is reserved exclusively for semantic status (destructive/warning/success/info). HTTP method chips are bold monospace text on a flat neutral chip, not color-coded — a deliberate break from Postman's convention. Status colors always come from `Badge` variants, never hardcoded per component.

---

## Backend — `devmetrics-backend`

**Stack:** Node.js (ESM) + Express, `pg` (raw SQL, no ORM), PostgreSQL hosted on Supabase, `@supabase/supabase-js`.

```
app.js            entry point, route mounting, health check
config/            db.js (pg Pool + transaction helper), bootstrap.js (env loading)
routes/            apiKey.js, auth.js, projects.js, sessions.js, tests.js
controllers/        one per resource, plus testRunController (run execution)
models/             ApiKey, Project, Test, TestRequest, Session, RunFinding, Request — thin classes wrapping parameterized SQL
services/           testRunner.js (execution engine), analysis.js (finding detection), compare.js (run diffing)
middleware/auth.js   validateApiKey, validateAdminKey, validateDashboardAccess
scripts/             setup.js (base schema) + incremental migrations
```

### API endpoints

| Method | Path | Auth |
|---|---|---|
| `POST` | `/auth/register` | — |
| `GET` | `/auth/api-key/:userId` | — |
| `POST` `GET` `PATCH` `DELETE` | `/projects`, `/projects/:id` | `x-api-key` |
| `GET` | `/projects/:projectId/tests` | `x-api-key` |
| `POST` `GET` `PATCH` `DELETE` | `/tests`, `/tests/:id` | `x-api-key` |
| `POST` `PATCH` `DELETE` | `/tests/:testId/requests(/:requestId)` | `x-api-key` |
| `POST` | `/tests/:testId/runs` | `x-api-key` — starts a real run |
| `GET` | `/tests/:testId/runs` | `x-api-key` — run history |
| `POST` | `/sessions` | `x-api-key` |
| `PATCH` | `/sessions/:id/end` | `x-api-key` |
| `GET` | `/sessions`, `/sessions/:id` | `x-api-key` |
| `GET` | `/sessions/compare?a=&b=` | `x-api-key` |
| `GET` | `/sessions/shared/:token` | **public**, scoped by share token |
| `POST` `GET` `PUT` `DELETE` | `/apikey(/:key)` | `x-admin-key` |
| `GET` | `/health` | — |

### Run execution engine

`services/testRunner.js` executes each Test's requests with a custom Node `http`/`https` client, with SSRF protections built in:

- blocks requests to private/loopback/link-local IP ranges (resolves DNS first, checks the resolved address)
- caps response size, redirects, header count/value length, and per-request timeout

Each request's result is persisted, then `services/analysis.js` runs rule-based detection over the run:

| Finding type | Rule |
|---|---|
| `error` | any 4xx/5xx per endpoint (critical if any 5xx) |
| `error_burst` | multiple errors within a short rolling window |
| `duplicate_request` | many identical requests within a short window |
| `retry_pattern` | repeated calls to the same endpoint in quick succession |
| `latency_anomaly` | response time statistically above that endpoint's mean |
| `assertion_failure` | actual status doesn't match the test request's expected status |

`services/compare.js` summarizes two sessions (request count, error count, avg response time, per-endpoint breakdown) for the Compare screen.

### Setup

```bash
cd devmetrics-backend
npm install
```

`.env`:
```
DATABASE_URL=postgresql://...            # or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
ADMIN_KEY=...                             # gates /apikey admin routes
NODE_ENV=development
PORT=5000
```

```bash
npm run setup              # base schema
npm run migrate:sessions   # tests/sessions/findings tables
npm run seed                # seed a dev API key
npm run dev
```

---

## Insights service — `insights-service`

Powers **Project Insights** (`/projects/:id/insights`): error-rate and latency trend across a project's run history, plus flaky-endpoint detection — endpoints that pass in some runs and fail in others across the project's tests. The `error` finding type in `devmetrics-backend` flags consistent per-run failures; this catches the inconsistent kind, which nothing else in DevMetrics computes.

**Stack:** FastAPI, pandas, httpx. Charts render client-side with D3, in the dashboard.

Calls `devmetrics-backend` using the caller's own `x-api-key`, forwarded per-request from the dashboard. No stored credential, no database access.

```
insights-service/
├── main.py           config, backend client, pandas aggregation, all routes
├── requirements.txt
└── .env.example
```

### API endpoints

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/insights/project/{project_id}/trend?days=30` | `x-api-key` |
| `GET` | `/api/insights/project/{project_id}/flakiness?limit=100` | `x-api-key` |
| `GET` | `/health` | — |

### Setup

```bash
cd insights-service
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

`.env`:
```
DEVMETRICS_API_BASE_URL=http://localhost:5000
DASHBOARD_ORIGINS=http://localhost:5173,http://localhost:3000
```

```bash
uvicorn main:app --reload --port 8000
```

Requires `devmetrics-backend` running first.

---

## Database — PostgreSQL (Supabase-hosted)

No ORM — every model is a thin class over parameterized `pg` queries.

| Table | Purpose |
|---|---|
| `api_keys` | one row per provisioned key (per-user or admin-issued) |
| `projects` | optional grouping for tests |
| `tests` | reusable test definitions |
| `test_requests` | ordered HTTP requests inside a test |
| `sessions` | a Run — internal table name predates the product's "Run" terminology |
| `run_findings` | analysis output per run, with severity |
| `requests` | individual request results per run |

Notes:
- `sessions.run_status` is constrained to `queued / running / analyzing / completed / failed / cancelled`.
- Every run gets a public share token by default, enabling the read-only share link.
- Foreign keys cascade on delete (`tests → test_requests`, `sessions → run_findings`).
- `insights-service` never connects to Postgres directly.

---

## Getting started

```bash
git clone https://github.com/developer8HARSHAL/DevMetrics.git
cd DevMetrics

cd devmetrics-backend && npm install && npm run setup && npm run seed && npm run dev
# second terminal
cd devmetrics-dashboard && npm install && npm run dev
# third terminal
cd insights-service && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

## Roadmap

- Global 401/403 handling on the frontend (session expiry, revoked keys currently fail per-screen).
- Modal/Dialog and Toast primitives — several flows use inline patterns as an interim solution.
- Compare view: richer per-endpoint diffing UI.

## Contributing

Issues and PRs are welcome. Please open an issue before starting significant work.
