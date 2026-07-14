# Pickleball SG Booking App

A production-ready booking application for Pickleball SG aligned with SportyGo branding.

**Stack:** React 18 + Vite + TypeScript (frontend) | Express 4 + TypeScript (backend) | Supabase PostgreSQL (Phase 2 database) | Docker + Nginx (containerisation) | Netlify (static hosting)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Prerequisites](#2-prerequisites)
3. [Local Development | No Docker](#3-local-development--no-docker)
4. [Local Development | Docker Compose](#4-local-development--docker-compose)
5. [Environment Variables](#5-environment-variables)
6. [Deploy Frontend to Netlify](#6-deploy-frontend-to-netlify)
7. [Deploy Backend to Production](#7-deploy-backend-to-production)
8. [Deploy with Docker | Production](#8-deploy-with-docker--production)
9. [Phase 2 | Supabase Database](#9-phase-2--supabase-database)
10. [Maintenance Guide](#10-maintenance-guide)
11. [API Reference](#11-api-reference)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Project Structure

```
pickleball_booking/
+-- frontend/                       # React 18 + Vite + TypeScript
|   +-- src/
|   |   +-- components/             # Shared UI components
|   |   |   +-- Header.tsx
|   |   |   +-- StepBar.tsx
|   |   |   +-- ErrorBanner.tsx
|   |   |   +-- Spinner.tsx
|   |   +-- context/
|   |   |   +-- AppContext.tsx      # Central state (useReducer + Context)
|   |   +-- lib/
|   |   |   +-- api.ts              # All backend API calls
|   |   |   +-- constants.ts        # Pricing, packages, durations
|   |   |   +-- pricing.ts          # Pure pricing calculation functions
|   |   |   +-- utils.ts            # Date helpers, receipt ID, ARIA
|   |   +-- screens/                # One component per app screen
|   |   |   +-- HomeScreen.tsx
|   |   |   +-- ScheduleScreen.tsx
|   |   |   +-- LoginScreen.tsx
|   |   |   +-- CheckoutScreen.tsx
|   |   |   +-- SuccessScreen.tsx
|   |   +-- types/index.ts          # All TypeScript types
|   |   +-- App.tsx                 # Root | renders active screen
|   |   +-- index.css               # Global CSS (SportyGo theme)
|   |   +-- main.tsx                # React entry point
|   +-- index.html
|   +-- vite.config.ts
|   +-- tsconfig.json
|   +-- package.json
|   +-- .env.example
|
+-- backend/                        # Express 4 + TypeScript API
|   +-- src/
|   |   +-- lib/supabase.ts         # Supabase admin client
|   |   +-- middleware/
|   |   |   +-- authMiddleware.ts   # JWT verification
|   |   +-- routes/
|   |   |   +-- auth.ts             # POST /api/auth/login
|   |   |   +-- slots.ts            # GET  /api/slots
|   |   |   +-- bookings.ts         # POST /api/bookings
|   |   |   +-- packages.ts         # GET  /api/packages
|   |   +-- index.ts                # Express app entry
|   +-- package.json
|   +-- tsconfig.json
|   +-- .env.example
|
+-- Dockerfile.frontend             # Multi-stage: Vite build ? Nginx serve
+-- Dockerfile.backend              # Multi-stage: tsc ? Node.js runtime
+-- docker-compose.yml              # Orchestrates both services locally
+-- nginx.conf                      # Nginx SPA config
+-- netlify.toml                    # Netlify build config (frontend only)
+-- README.md
```

---

## 2. Prerequisites

| Tool | Minimum version | Install |
|------|----------------|---------|
| Node.js | 20 | [nodejs.org](https://nodejs.org) |
| npm | 10 | included with Node |
| Docker Desktop | 24 | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Git | any | [git-scm.com](https://git-scm.com) |

---

## 3. Local Development | No Docker

Fastest way to start. Runs frontend and backend as separate processes.

### Step 1 | Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

If `npm install` previously failed in `backend/` under Git Bash with `Could not determine Node.js install directory`, pull this change and run `npm install` again. The backend no longer uses `tsx` and now uses `nodemon` + `ts-node`, which avoids that Windows shell issue.

### Step 2 | Configure environment files

```bash
# Backend
cd backend
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux

# Frontend
cd ../frontend
copy .env.example .env.local  # Windows
# cp .env.example .env.local  # macOS / Linux
```

Edit `backend/.env` | set at minimum:

```
JWT_SECRET=any-long-random-string-you-choose
```

### Step 3 | Start the backend

Open a terminal inside `backend/`:

```bash
npm run dev
```

This starts the Express API with `nodemon`, so backend code changes reload automatically.

Backend runs at **http://localhost:3001**

Verify: `curl http://localhost:3001/api/health`
Expected: `{"status":"ok","timestamp":"..."}`

### Step 4 | Start the frontend

Open a **second** terminal inside `frontend/`:

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.
The Vite dev server proxies all `/api/*` requests to the backend automatically.

---

## 4. Local Development | Docker Compose

Gives a production-like environment locally with a single command.

### Step 1 | Set up backend env file

```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux
```

Edit `.env` and set `JWT_SECRET`.

### Step 2 | Build and start everything

From the **project root**:

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend  | http://localhost:3001 |

### Step 3 | Stop

```bash
docker compose down
```

### Rebuild after code changes

```bash
docker compose up --build --force-recreate
```

---

## 5. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Port the backend listens on |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin |
| `JWT_SECRET` | **Yes** | `dev-secret-...` | JWT signing secret | **change in production** |
| `SUPABASE_URL` | Phase 2 | | | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Phase 2 | | | Supabase service role key (server-side only) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | `''` (proxied) | Backend URL for production builds |

---

## 6. Deploy Frontend to Netlify

### Option A | Git-based deploy (recommended for teams)

1. Push this repository to GitHub or GitLab.
2. Log in at [app.netlify.com](https://app.netlify.com) ? **Add new site ? Import existing project**.
3. Netlify reads `netlify.toml` automatically.
4. In **Site settings ? Environment variables**, add:
   - `VITE_API_BASE_URL` = your production backend URL
5. Click **Deploy site**.

Every `git push` to the main branch triggers a rebuild and deploy.

### Option B | Netlify CLI

```bash
npm install -g netlify-cli
netlify login

cd frontend
npm run build

cd ..
netlify deploy --prod --dir=frontend/dist
```

---

## 7. Deploy Backend to Production

The backend must run on a Node.js-capable platform (not a static host).

### Option A | Railway (easiest, free tier)

1. Push to GitHub.
2. Go to [railway.app](https://railway.app) ? New Project ? Deploy from GitHub.
3. Set root directory to `backend/`.
4. Add environment variables in the dashboard.

### Option B | Render

1. Go to [render.com](https://render.com) ? New Web Service.
2. Set root directory to `backend/`.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables in the dashboard.

### Option C | VPS with PM2

```bash
cd pickleball_booking/backend
npm install
npm run build
npm install -g pm2
pm2 start dist/index.js --name pickleball-sg-backend
pm2 save && pm2 startup
```

---

## 8. Deploy with Docker | Production

### Build versioned images

From the **project root**:

```bash
# Backend
docker build -f Dockerfile.backend -t pickleball-sg-backend:v1.0.0 ./backend

# Frontend (inject the production backend URL at build time)
docker build -f Dockerfile.frontend \
  --build-arg VITE_API_BASE_URL=https://your-backend-url.com \
  -t pickleball-sg-frontend:v1.0.0 \
  ./frontend
```

### Push to a container registry

```bash
docker tag pickleball-sg-backend:v1.0.0  yourhubuser/pickleball-sg-backend:v1.0.0
docker push yourhubuser/pickleball-sg-backend:v1.0.0

docker tag pickleball-sg-frontend:v1.0.0 yourhubuser/pickleball-sg-frontend:v1.0.0
docker push yourhubuser/pickleball-sg-frontend:v1.0.0
```

### GCP Cloud Run example

```bash
gcloud run deploy pickleball-sg-backend \
  --image IMAGE_URI \
  --port 3001 \
  --set-env-vars JWT_SECRET=your-secret,FRONTEND_URL=https://your-frontend.netlify.app \
  --allow-unauthenticated
```

### Zero-downtime update

```bash
docker build -f Dockerfile.backend -t pickleball-sg-backend:v1.1.0 ./backend
docker push yourhubuser/pickleball-sg-backend:v1.1.0
# Update the running service | platform switches traffic with no downtime
```

---

## 9. Phase 2 | Supabase Database

### Step 1 | Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a project.
2. Go to **Settings ? API** and copy the **Project URL** and **service_role** key.

### Step 2 | Run the schema SQL

In the Supabase SQL editor:

```sql
-- Slots (real bookings override the deterministic mock)
create table slots (
  id        uuid primary key default gen_random_uuid(),
  slot_date date not null,
  slot_time time not null,
  is_booked boolean default false,
  unique (slot_date, slot_time)
);

-- Bookings
create table bookings (
  id             uuid primary key default gen_random_uuid(),
  booking_type   text not null,
  slot_date      date not null,
  slot_time      time not null,
  duration_mins  int,
  package_id     text,
  pay_method     text not null,
  grand_total    numeric(10,2),
  receipt_id     text unique not null,
  customer_email text,
  status         text default 'confirmed',
  created_at     timestamptz default now()
);

alter table slots    enable row level security;
alter table bookings enable row level security;
```

### Step 3 | Connect the backend

In `backend/.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The backend automatically detects these and uses the real database. Without them, it falls back to deterministic mock data (Phase 1 mode).

---

## 10. Maintenance Guide

### Changing court rental price

`frontend/src/lib/constants.ts`:

```typescript
export const COURT_RATE = 28;  // SGD per hour
```

### Changing platform fee or GST rate

`frontend/src/lib/constants.ts`:

```typescript
export const PLATFORM_FEE = 1.50;
export const TAX_RATE     = 0.09;  // 9%
```

### Adding a coaching package

Add to `PACKAGES` in **both**:
- `frontend/src/lib/constants.ts`
- `backend/src/routes/packages.ts`

```typescript
{ id: 'pack25', label: '25-Session Pack', price: 550, per: 'SGD 22.00 / session' },
```

### Changing available booking hours

`backend/src/routes/slots.ts`:

```typescript
for (let h = 8; h < 22; h++) {  // Change 8 (start) and 22 (end) here
```

### Adjusting pre-booked slot density (Phase 1 mock)

`backend/src/routes/slots.ts`:

```typescript
return Math.abs(hash) % 4 === 0; // ~25% | use % 2 for ~50%, % 10 for ~10%
```

### Clearing real slot data (Supabase)

In the Supabase SQL editor:

```sql
delete from slots;
delete from bookings;
```

---

## 11. API Reference

Base path: `/api`

### `GET /api/health`

No auth. Returns server status.

```json
{ "status": "ok", "timestamp": "2026-07-10T10:00:00.000Z" }
```

---

### `POST /api/auth/login`

No auth.

**Body:** `{ "email": "user@example.com", "password": "mypassword" }`

**200:** `{ "token": "<jwt>", "email": "user@example.com" }`

**400:** `{ "error": "A valid email address is required." }`

---

### `GET /api/slots?date=YYYY-MM-DD`

No auth.

**200:**
```json
{
  "slots": [
    { "time": "08:00", "key": "2026-07-10_08:00", "booked": false },
    { "time": "08:30", "key": "2026-07-10_08:30", "booked": true }
  ]
}
```

---

### `POST /api/bookings`

Requires `Authorization: Bearer <token>`.

**Body:**
```json
{
  "bookingType": "court",
  "selectedDate": "2026-07-10",
  "selectedTime": "14:00",
  "durationMins": 60,
  "packageOption": null,
  "payMethod": "STRIPE",
  "grandTotal": 31.02,
  "receiptId": "SG-AB12CD34EF",
  "customerEmail": "user@example.com"
}
```

**200:** `{ "receiptId": "SG-AB12CD34EF", "status": "confirmed" }`

**402:** `{ "error": "Payment could not be processed. Please try again." }` (10% simulated failure | retry eligible)

---

### `GET /api/packages`

No auth.

**200:** `{ "packages": [ { "id": "single", "label": "Single Session", "price": 120, "per": "..." }, ... ] }`

---

## 12. Troubleshooting

| Problem | Solution |
|---------|----------|
| Frontend shows "Failed to load slots" | Ensure backend is running on port 3001. Run `npm run dev` inside `backend/`. |
| CORS error in browser console | Set `FRONTEND_URL` in `backend/.env` to match the exact URL shown in your browser. |
| Login always returns 401 | Ensure `JWT_SECRET` is set in `backend/.env`. |
| Payment always fails | 10% simulated failure rate is by design | retry the payment. |
| Docker port 8080 already in use | Edit `docker-compose.yml`: change `'8080:80'` to another free port e.g. `'9090:80'`. |
| Netlify build fails | Confirm `netlify.toml` has `base = "frontend"`. Ensure `VITE_API_BASE_URL` env var is set in the Netlify dashboard. |
| Supabase not saving bookings | Verify `SUPABASE_URL` starts with `https://` and `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key (not anon). App runs in mock mode if unconfigured. |
| `npm install` fails in `backend/` on Git Bash with `Could not determine Node.js install directory` | Update to this version of `backend/package.json` and rerun `npm install`. The backend now uses `nodemon` + `ts-node` instead of `tsx`. |
| TypeScript errors after code change | Run `npm run build` inside `frontend/` | it compiles and reports all type errors at once. |

---

## Resources

- Supabase dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Netlify dashboard: [https://app.netlify.com](https://app.netlify.com)
- Docker Hub: [https://hub.docker.com](https://hub.docker.com)
