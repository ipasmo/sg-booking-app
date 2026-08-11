# Cloudflare Deployment Guide (Final Stack)

This guide is updated for your requested stack:

- Frontend deployment: **Cloudflare Pages**
- Backend deployment: **Cloudflare Containers** (with GitHub integration)
- Database: **Neon PostgreSQL**

Repository:
- https://github.com/ipasmo/sg-booking-app

---

## 1. Final Architecture (Simple and Low Overhead)

## Frontend
- Cloudflare Pages
- Source: `frontend/`
- Auto deploy from GitHub on push/merge

## Backend
- Cloudflare Containers
- Source: `backend/` with `Dockerfile.backend`
- Auto deploy from GitHub
- Runs existing Express server with minimal code changes

## Database
- Neon PostgreSQL
- Existing backend `pg` code continues to work

## Optional accelerator
- Hyperdrive can be added later in front of Neon for global connection optimization.
- Not required for day-1 deployment.

---

## 2. Important Note About PostgreSQL on Cloudflare

Cloudflare does **not** currently provide a native managed PostgreSQL database.

So your PostgreSQL path is:
- Neon PostgreSQL (database host), plus
- Cloudflare compute (Pages + Containers).

This matches your target stack and keeps deployment simple.

---

## 3. Deployment Steps (GitHub Integrated, Minimal Steps)

## Step A: Prepare repository

1. Ensure code is pushed to GitHub:
   - https://github.com/ipasmo/sg-booking-app
2. Confirm local build passes:
   - `frontend`: `npm run build`
   - `backend`: `npm run build`

## Step B: Deploy frontend to Cloudflare Pages

1. Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git.
2. Select repo: `ipasmo/sg-booking-app`.
3. Build settings:
   - Project root: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add env vars in Pages:
   - `VITE_API_BASE_URL=https://api.yourdomain.com`
   - `VITE_STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>`
5. Deploy.

## Step C: Provision Neon PostgreSQL

1. Create project in Neon.
2. Create a production database.
3. Copy Neon connection string (SSL enabled).

## Step D: Deploy backend to Cloudflare Containers

1. Cloudflare Dashboard -> Workers & Pages -> Create -> Containers app.
2. Connect same GitHub repo.
3. Configure container build using backend Dockerfile:
   - `Dockerfile.backend`
4. Add backend environment variables/secrets:
   - `NODE_ENV=production`
   - `PORT=3001`
   - `JWT_SECRET=<strong-random-secret>`
   - `DATABASE_URL=<Neon Postgres URL>`
   - `DATABASE_SSL=true`
   - `FRONTEND_URL=https://<your-pages-domain>`
   - `STRIPE_SECRET_KEY=<stripe-secret-key>`
   - `STRIPE_CURRENCY=sgd`
5. Deploy backend and map custom API domain:
   - `api.yourdomain.com`
6. Verify:
   - `GET /api/health` returns status ok.

## Step E: Initialize production database

Run once against production DB:

1. `npm run db:migrate`
2. `npm run db:seed`

## Step F: Connect frontend and backend

1. Set/confirm Pages env:
   - `VITE_API_BASE_URL=https://api.yourdomain.com`
2. Redeploy frontend.
3. Smoke test:
   - Login
   - Browse sports/facilities
   - Create booking
   - View bookings
   - Profile page

---

## 4. CI/CD Flow (Very Easy Maintenance)

1. Push feature branch.
2. Create PR.
3. Preview deploys (Pages preview URL).
4. Merge to `main`.
5. Production auto deploy:
   - Frontend: Pages
   - Backend: Containers

This gives minimal operational overhead after setup.

---

## 5. Pricing (Updated for Your Selected Stack)

You requested:
- Traffic profile: **Small**
- Runtime choice: **Cloudflare Containers**
- DB tier: **Neon Free/Launch**
- Currency: **SGD**

Assumption for conversion used in this file:
- 1 USD ~= 1.35 SGD (adjust with your finance rate)

Reference docs:
- Workers/Pages pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Containers pricing: https://developers.cloudflare.com/containers/
- Neon pricing: https://neon.tech/pricing

## 5.1 Expected monthly cost (small traffic)

## Cloudflare
1. Pages hosting: **SGD 0** (typically within free limits for small usage)
2. Workers paid base plan (required for Containers): **~SGD 6.75/month** (USD 5)
3. Containers usage over included quota:
   - Small traffic usually low or zero overage if backend usage is light.
   - Budget placeholder: **SGD 0 to SGD 8/month**

## Neon PostgreSQL
1. Neon Free/Launch plan: **SGD 0** (if usage remains within free tier)
2. If you outgrow free limits, Neon paid plan starts additionally (plan-dependent).

## Total monthly estimate (this stack)

### Best case (small usage within free/included quotas)
- **~SGD 6.75/month**

### Practical safe budget (small production usage)
- **~SGD 10 to SGD 20/month**

This is usually the realistic range for small apps on this exact stack.

---

## 6. Cost Drivers You Should Watch

1. Backend container active runtime (CPU/memory seconds).
2. API request growth.
3. Neon storage/compute growth beyond free tier.
4. Build frequency (if you exceed free Pages build limits).

## 6.1 When cost crosses SGD 20/month (what usually caused it)

If your total monthly cost goes above **SGD 20**, it is usually one or more of these:

1. Backend container is staying warm too long due to constant traffic.
2. API calls are growing beyond small-app levels.
3. Neon has moved past Free/Launch limits (storage/compute growth).
4. Unoptimized endpoints are doing heavier DB operations than expected.

## 6.2 Practical thresholds to track

Use this as a quick signal table:

1. If monthly API traffic approaches **~1M requests**: expect container/runtime charges to rise.
2. If average request latency climbs with higher DB usage: Neon or query optimization is needed.
3. If Neon data size and compute are consistently increasing month-over-month: paid Neon tier may be required.
4. If monthly spend trend crosses **SGD 20 for 2 consecutive months**: start cost optimization immediately.

## 6.3 What to do when crossing SGD 20

Do these in order (lowest effort first):

1. Add response caching for read-heavy endpoints.
2. Add indexes for high-frequency query filters/sorts.
3. Reduce unnecessary polling from frontend.
4. Move heavy/non-critical writes to background jobs.
5. Enable Hyperdrive (if not enabled) to optimize connection behavior and reduce DB pressure.
6. Review whether any always-on/long-running container behavior can be reduced.

## 6.4 Budget guardrail recommendation

Set your alerts this way:

1. Alert at **SGD 12** (early warning).
2. Alert at **SGD 18** (investigation required).
3. Hard review at **SGD 20** (optimize or plan tier changes).

---

## 7. Production Checklist

1. Use strong `JWT_SECRET`.
2. Keep `NODE_ENV=production`.
3. Restrict CORS to app domain.
4. Keep `/api/dev/reset-seed` non-production only.
5. Set uptime checks on `/api/health`.
6. Enable Cloudflare logs/alerts.
7. Confirm Neon backup/restore settings.

---

## 8. Final Recommendation

For your objective (easy setup + low maintenance + GitHub integration):

1. Cloudflare Pages for frontend
2. Cloudflare Containers for backend
3. Neon PostgreSQL for database

This is the simplest reliable path for your current codebase with minimal rewrite and predictable cost.

---

## 9. Quick Start Summary

1. Connect repo to Pages (`frontend`).
2. Connect repo to Containers (`backend`, `Dockerfile.backend`).
3. Create Neon DB and set `DATABASE_URL` in backend secrets.
4. Set `VITE_API_BASE_URL` in Pages.
5. Deploy both.
6. Run migrate + seed once.
7. Go live.
