# Implementation Plan — M365 Tenant Advisor Backend & Frontend Integration

We will implement the next phase of the M365 Tenant Advisor: building the Node.js Express backend and connecting the React frontend to it.

Since local Docker/PostgreSQL/Redis services are not running, we will design the backend with a **dual-mode architecture**:
1. **Developer Mode (Default):** Runs immediately without external services, using an in-memory or SQLite database and in-memory event queues for the scan pipeline.
2. **Production Mode:** Fully configured for Azure App Service/Container Apps, connecting to PostgreSQL, Redis/BullMQ, Microsoft Graph API, and Azure OpenAI via environment variables.

---

## User Review Required

> [!IMPORTANT]
> **Simulated Backend Scanning:** We will implement the actual background scan orchestrator and progress updater using **Server-Sent Events (SSE)**. This allows the frontend to receive real-time, step-by-step progress logs (e.g., "Auditing MFA Policies", "Calculating License Savings") directly from the backend, simulating the event-driven scan pipeline proposed in the architecture.
>
> **Database:** We will use **SQLite / JSON files** for Developer Mode so it works instantly on your local Windows system. If PostgreSQL credentials are provided in `.env`, the server will seamlessly switch to a PostgreSQL connection.

---

## Proposed Changes

We will create a backend application inside a new `backend/` directory and connect the React app to it.

### 1. Backend Application

#### [NEW] [backend/package.json](file:///c:/Users/VibhuDixit/OneDrive%20-%20Meridian%20Solutions/Desktop/M365%20Tenant%20Advisor/backend/package.json)
- Express, CORS, dotenv, uuid, sqlite3 (or lowdb for easy JSON storage), and nodemon (for dev auto-reload).

#### [NEW] [backend/.env](file:///c:/Users/VibhuDixit/OneDrive%20-%20Meridian%20Solutions/Desktop/M365%20Tenant%20Advisor/backend/.env)
- Environment configuration: `PORT=5000`, `NODE_ENV=development`, database configuration placeholders, and Microsoft Client ID/Secrets.

#### [NEW] [backend/src/server.js](file:///c:/Users/VibhuDixit/OneDrive%20-%20Meridian%20Solutions/Desktop/M365%20Tenant%20Advisor/backend/src/server.js)
- Express entrypoint configuring CORS, JSON parsing, SSE event routes, and error handlers.

#### [NEW] [backend/src/db.js](file:///c:/Users/VibhuDixit/OneDrive%20-%20Meridian%20Solutions/Desktop/M365%20Tenant%20Advisor/backend/src/db.js)
- Database adapter that loads seed mock data on launch, providing CRUD operations for Tenants, Scans, and Scan Results.

#### [NEW] [backend/src/scanEngine.js](file:///c:/Users/VibhuDixit/OneDrive%20-%20Meridian%20Solutions/Desktop/M365%20Tenant%20Advisor/backend/src/scanEngine.js)
- Core scan orchestrator that executes background scan modules (License Optimization, Security Gaps, Cost Leakage, AI Summary).
- Emits real-time scanning steps to client listeners using Server-Sent Events (SSE).

#### [NEW] [backend/src/routes.js](file:///c:/Users/VibhuDixit/OneDrive%20-%20Meridian%20Solutions/Desktop/M365%20Tenant%20Advisor/backend/src/routes.js)
- REST API endpoints for:
  - `GET /api/tenants` — Fetch onboarded tenants.
  - `GET /api/tenants/:id` — Fetch tenant dashboard data.
  - `POST /api/scans/start` — Initiate a tenant scan job.
  - `GET /api/scans/:id/progress` — SSE stream for real-time scan logs.
  - `GET /api/scans/:id/results` — Fetch completed scan findings.

---

### 2. Frontend Integration

#### [MODIFY] [frontend/vite.config.js](file:///c:/Users/VibhuDixit/OneDrive%20-%20Meridian%20Solutions/Desktop/M365%20Tenant%20Advisor/frontend/vite.config.js)
- Configure an API proxy so `http://localhost:5173/api` routes transparently to `http://localhost:5000/api`.

#### [NEW] [frontend/src/services/api.js](file:///c:/Users/VibhuDixit/OneDrive%20-%20Meridian%20Solutions/Desktop/M365%20Tenant%20Advisor/frontend/src/services/api.js)
- Unified API client class to perform fetch requests, handle SSE connections, and format backend responses.

#### [MODIFY] [frontend/src/App.jsx](file:///c:/Users/VibhuDixit/OneDrive%20-%20Meridian%20Solutions/Desktop/M365%20Tenant%20Advisor/frontend/src/App.jsx)
- Update state handlers to fetch tenants from the backend upon mounting.
- Replace local state updates with backend-triggered scans, hooking into the SSE progress stream.

#### [MODIFY] [frontend/src/components/ScanProgress.jsx](file:///c:/Users/VibhuDixit/OneDrive%20-%20Meridian%20Solutions/Desktop/M365%20Tenant%20Advisor/frontend/src/components/ScanProgress.jsx)
- Connect component to the real-time SSE progress stream rather than internal timers.

---

## Verification Plan

### Automated & Manual Verification
- **Run Backend:** Start `nodemon src/server.js` and verify it serves endpoints at `http://localhost:5000`.
- **Scan & Event Stream Test:** Send a `POST` to `/api/scans/start` and listen on `/api/scans/:id/progress` to verify that real-time logs are streamed as SSE events.
- **Frontend Integration Walkthrough:** Open the browser, select a tenant, trigger a scan, watch the SSE-powered log terminal stream live logs from the backend, and verify that the dashboard updates automatically with backend metrics upon completion.
