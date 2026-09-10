DevMetrics

DevMetrics is a web-based API performance testing and regression analysis platform.

It lets developers define reusable API tests, execute those tests against real HTTP endpoints, inspect each run, identify deterministic findings, and compare runs to detect regressions.

Product workflow

Tests → Test Requests → Start Run → Running → Completed → Report → Findings → Compare

A Test is a reusable definition containing one or more Test Requests. A Run is one execution of a Test. Each Run stores the request results and the findings produced by the analysis service.

Core features

Create and manage reusable API tests.

Define multiple HTTP requests inside a test.

Support GET, POST, PUT, PATCH, and DELETE requests.

Execute a test from the dashboard.

Track Run status and request results.

Inspect completed Run reports and timelines.

Generate deterministic findings for request-level problems and patterns.

Compare two Runs and surface regressions, improvements, and mixed changes.

Share Run reports publicly through a share token.

Manage DevMetrics API keys used by the dashboard and API clients.

View Run-based analytics.

Architecture

┌─────────────────────┐
│ DevMetrics Dashboard│
│ React + Vite        │
└──────────┬──────────┘
           │ HTTP API
           ▼
┌─────────────────────┐
│ DevMetrics Backend  │
│ Node.js + Express   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ PostgreSQL Database │
└─────────────────────┘

The backend owns Test execution, Run creation, request execution, result persistence, finding analysis, and Run comparison. The dashboard consumes those APIs and does not depend on passive API traffic tracking.

Main domain objects

Test

A reusable API test definition.

Test Request

An HTTP request belonging to a Test. It defines the method, target URL, headers, body, and related request configuration.

Run

One execution of a Test. Runs are stored by the backend under the existing sessions model and API namespace.

Request Result

The result of an individual Test Request during a Run.

Finding

A deterministic analysis result produced from Run request results. Findings can identify errors, error bursts, duplicate requests, retry patterns, and latency anomalies.

Dashboard routes

Route

Purpose

/

Run list and Run workspace

/tests

Test library

/tests/:id

Test builder and Run history

/sessions/:id

Run report

/sessions

Runs page

/compare

Compare two Runs

/analytics

Run-based analytics

/api-key

API key management

/shared/:token

Public shared Run report

Backend API overview

Authentication

The dashboard uses an API key for protected API requests. Public shared reports use their share token and do not require the dashboard API key.

Tests

POST   /tests
GET    /tests
GET    /tests/:id
PATCH  /tests/:id
DELETE /tests/:id

POST   /tests/:testId/requests
PATCH  /tests/:testId/requests/:requestId
DELETE /tests/:testId/requests/:requestId

GET    /tests/:testId/runs
POST   /tests/:testId/runs

Runs

POST   /sessions
GET    /sessions
GET    /sessions/:id
PATCH  /sessions/:id/end
GET    /sessions/compare?a=<runA>&b=<runB>
GET    /sessions/shared/:token

API keys

POST   /apikey
GET    /apikey
GET    /apikey/:key
PUT    /apikey/:key
DELETE /apikey/:key

DELETE /apikey/:key revokes the key by default. Passing permanent=true permanently deletes it.

Health

GET /health

Run states

A Run can move through execution states such as:

queued → running → completed

A completed Run contains its request results and any findings generated during analysis.

Run comparison

The comparison service evaluates two Runs using metrics and structural differences such as:

Average response time

Error count

Request count

Total duration

Endpoints present only in one Run

HTTP status changes

New findings

Resolved findings

The comparison returns a verdict such as regressed, improved, unchanged, or mixed.

Local development

Backend

cd devmetrics-backend
npm install
npm run dev

Configure the backend environment variables required by the local database and authentication setup before starting the server.

Dashboard

cd devmetrics-dashboard
npm install
npm run dev

Set VITE_BACKEND_URL to the backend URL when the backend is not running at the default local address.

Production build

cd devmetrics-dashboard
npm run build

Security

The backend should validate API targets before executing requests. Production deployments should enforce HTTPS where appropriate and protect API keys from being exposed in source control.

Project structure

devmetrics/
├── devmetrics-backend/      # Express API and test execution engine
└── devmetrics-dashboard/    # React + Vite dashboard

What DevMetrics is not

DevMetrics does not use an SDK to passively intercept application traffic. It does not depend on browser instrumentation, desktop agents, or /track and /logs/metrics telemetry endpoints.

