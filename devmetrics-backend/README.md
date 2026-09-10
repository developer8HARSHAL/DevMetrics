DevMetrics Backend

Backend API and test execution service for DevMetrics.

The backend provides Test management, Test Request management, Run execution, Run reporting, deterministic finding analysis, Run comparison, API key management, authentication, shared reports, and health checks.

Stack

Node.js

Express

PostgreSQL

Responsibilities

Authenticate protected API requests.

Store Tests and Test Requests.

Start backend-generated Runs.

Execute Test Requests over HTTP.

Persist request results for each Run.

Analyze Run results and persist findings.

Compare two Runs for regression analysis.

Manage API keys.

Serve public shared Run reports.

Expose service and database health.

API structure

Authentication

Protected Test, Run, and API-key operations require the configured authentication mechanism. The dashboard sends its active API key with protected requests.

Public shared reports are scoped by share token and do not require the dashboard API key.

Tests

All Test routes are under /tests.

POST   /tests
GET    /tests
GET    /tests/:id
PATCH  /tests/:id
DELETE /tests/:id

Test Requests

POST   /tests/:testId/requests
PATCH  /tests/:testId/requests/:requestId
DELETE /tests/:testId/requests/:requestId

A Test can contain multiple Test Requests. Requests are executed by the backend when the Test is run.

Test Runs

GET  /tests/:testId/runs
POST /tests/:testId/runs

POST /tests/:testId/runs creates and starts a real backend-generated Run for the selected Test.

Runs

Runs use the existing /sessions API namespace.

POST   /sessions
GET    /sessions
GET    /sessions/:id
PATCH  /sessions/:id/end
GET    /sessions/compare?a=<runA>&b=<runB>
GET    /sessions/shared/:token

A Run records execution metadata including status, start and end timestamps, duration, request count, error count, finding count, and highest finding severity.

Individual request results remain associated with the Run and are used to build the Run report.

Run analysis

After execution, the analysis service evaluates request results and persists deterministic findings.

Current finding categories include:

error

error_burst

duplicate_request

retry_pattern

latency_anomaly

Findings are stored for the Run and exposed through the Run reporting flow.

Run comparison

The comparison service compares two completed Runs.

The response includes deltas for:

Average response time

Error count

Request count

Duration

It also reports:

Endpoints only present in Run A

Endpoints only present in Run B

Shared endpoints

HTTP status changes

Resolved findings

New findings

Overall verdict

Possible verdicts are:

regressed
improved
unchanged
mixed

API key management

API key management is exposed under /apikey.

POST   /apikey
GET    /apikey
GET    /apikey/:key
PUT    /apikey/:key
DELETE /apikey/:key

Create

POST /apikey creates a new API key.

Request fields include:

owner

description

rateLimit

expiresAt

List

GET /apikey returns managed keys and their metadata.

Get

GET /apikey/:key returns a specific key and its metadata.

Update

PUT /apikey/:key updates supported key metadata such as description, status, rate limits, and expiration.

Revoke or delete

DELETE /apikey/:key revokes the key by default.

Use ?permanent=true for permanent deletion.

Shared reports

Shared Run reports are available at:

GET /sessions/shared/:token

This endpoint is public and is scoped by the Run share token.

Health check

GET /health

The health endpoint checks database connectivity and returns the service status, timestamp, uptime, and database status.

Configuration

Create the backend environment file from the project's environment example and configure the values required by the local PostgreSQL connection and authentication setup.

Typical local development values include:

PORT=5000
NODE_ENV=development

Database credentials depend on the local or hosted PostgreSQL environment.

Installation

cd devmetrics-backend
npm install

Development

npm run dev

Production

npm start

Verification

A basic backend verification should confirm:

The server starts successfully.

/health reports a healthy database connection.

A Test can be created.

Test Requests can be added to the Test.

A Test Run can be started.

The Run reaches its expected execution state.

The Run report contains request results and findings.

Two Runs can be compared.

Security

Validate and restrict outbound HTTP targets before executing them.

Block unsafe internal and private network targets where appropriate.

Enforce request timeouts and response-size limits.

Protect API keys and authentication secrets.

Use HTTPS in production.

Do not commit secrets to source control.

Removed legacy telemetry

The backend no longer uses the old SDK telemetry endpoints:

/track
/track/batch
/logs/metrics/overview
/logs/metrics/endpoint
/logs/metrics/recent
/logs/metrics/errors

Those endpoints belonged to the previous passive monitoring model and are not part of the current Test → Run workflow.