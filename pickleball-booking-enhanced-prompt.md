# Pickleball SG Application Specification (Features + Architecture)

## 1. Product Scope
Build a production-ready, responsive booking application for Pickleball SG aligned with SportyGo branding. The app should be simple to operate, easy to maintain by a small team, and deployable quickly.

## 2. Feature Requirements

### 2.1 Screen Flow (Single-Page Routing)
Implement 5 screens with client-side transitions and no full page reload:
1. Home
2. Calendar & Time Selector
3. Login
4. Checkout & Order Summary
5. Success & Receipt

### 2.2 Booking Modes
Support two booking types:
1. Court Rental
2. Coaching Session

### 2.3 Pricing Rules
Court rental:
1. Durations: 60, 90, 120 minutes
2. Rate: SGD 28 per hour
3. Amounts: 60m=28, 90m=42, 120m=56

Coaching:
1. Duration fixed at 60 minutes
2. Package options:
  - Single Session: SGD 120
  - 3-Session Pack: SGD 88
  - 10-Session Pack: SGD 250
  - 15-Session Pack: SGD 350
  - 20-Session Pack: SGD 450

Checkout math:
1. Platform fee: SGD 1.50 fixed
2. Tax: 9% of subtotal (2 decimal rounding)
3. Grand total: subtotal + platform fee + tax

### 2.4 Availability & Slot Logic
1. Generate rolling 14-day date list from current date.
2. Generate slots from 08:00 to 22:00 in 30-minute intervals.
3. Mark about 25% of slots booked by default (mocked).
4. Booked slots are disabled and cannot be selected.
5. Persist booked slots in browser localStorage.

### 2.5 State & Guard Rules
Maintain a central state object with:
1. `screen`
2. `bookingType`
3. `selectedDate`
4. `selectedTime`
5. `durationMins`
6. `packageOption`
7. `isLoggedIn`
8. `customerEmail`
9. `payMethod`
10. `bookedSlots`
11. `priceSubtotal`
12. `platformFee`
13. `tax`
14. `grandTotal`
15. `receiptId`
16. `whatsAppMockSent`

Navigation guards:
1. Cannot move from Home to Schedule without booking type.
2. Cannot move to Checkout without date and time.
3. If not logged in, route to Login before Checkout.
4. After login success, return to Checkout.
5. Success screen only after payment success.
6. Back navigation must preserve selections.

### 2.6 Login & Payment Simulation
Login:
1. Validate email format.
2. Validate password minimum length of 8.
3. Show inline form errors.
4. Add show/hide password toggle.
5. Simulate login loading for 600-1000ms.

Payment:
1. Final CTA label includes amount and method.
2. Button disabled until payment method selected.
3. Simulate payment loading for 1000-1500ms.
4. Simulate 90% success and 10% failure.
5. On failure, stay on Checkout with retry message.
6. On success, mark slot booked, persist data, generate receipt, route to Success.

### 2.7 Success Experience
1. Generate receipt ID format: `SG-` + 10 uppercase alphanumeric characters.
2. Show booking summary, payment method, total paid, and receipt ID.
3. Show mock WhatsApp confirmation block with masked number and sent time.

### 2.8 Design & UX Requirements
Theme:
1. Background: #0B0F19
2. Card surface: #161F30
3. Accent: #DFFF00
4. Primary text: #FFFFFF
5. Secondary text: #94A3B8
6. Font family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

Responsive behavior:
1. Mobile: up to 640px
2. Tablet: 641px to 1024px
3. Desktop: above 1024px
4. Horizontal date strip on small screens.
5. Adaptive slot grid (2 columns mobile, 4 or more desktop).

Accessibility:
1. Keyboard focusable controls.
2. Visible focus states.
3. ARIA live region for status updates.
4. Respect reduced motion preference.

### 2.9 Reliability States
Include polished UI states for:
1. No slots available
2. Login loading
3. Payment loading
4. Recoverable error banner with retry

## 3. Recommended Technology Stack (Simple + Maintainable)

### 3.1 Application Stack (Recommended for Phase 1)
1. Frontend: HTML5, CSS3, Vanilla JavaScript (ES6)
2. Build tool: None required
3. Package manager: Not required for phase 1
4. State handling: In-memory JS object + localStorage

Why this stack:
1. Very low learning curve
2. No framework lock-in
3. Minimal maintenance overhead
4. Easy handover for new team members

### 3.2 Optional Team Scale-Up Stack (Phase 2)
Use only when feature complexity grows:
1. Frontend: React + Vite + TypeScript
2. Lint/format: ESLint + Prettier
3. Test: Vitest + Playwright
4. API layer (if backend added): lightweight REST endpoints (Netlify Functions or Cloudflare Workers)

## 4. Deployment Stack (Simple + Reliable)

### 4.1 Primary Deployment Recommendation
1. Netlify static hosting (fastest setup for single-page app)
2. Git-based auto-deploy from repository
3. Branch previews for QA
4. This is the default for team onboarding and low-ops maintenance

### 4.2 Alternative Deployment
1. Vercel static deployment
2. Docker + Nginx when infra policy requires containerized hosting
3. Cloudflare Pages when team prefers Cloudflare ecosystem

### 4.3 Runtime/Hosting Notes
1. Enable HTTPS by default
2. Add cache headers for static assets
3. Configure SPA fallback to index.html

### 4.4 Docker Deployment (Local and Production)
Local Docker:
1. Use Nginx Alpine image for static app delivery.
2. Build image: `docker build -t sg-booking-app .`
3. Run container: `docker run -d -p 8080:80 --name sg-booking-app sg-booking-app`
4. Validate app at http://localhost:8080

Production Docker options:
1. Use the same image in container platforms (AWS ECS/Fargate, Azure Container Apps, GCP Cloud Run, DigitalOcean Apps).
2. Put a managed HTTPS load balancer or platform TLS in front.
3. Keep image immutable and versioned using Git tag or commit SHA.
4. For zero-downtime updates, deploy new container revision then switch traffic.

## 5. Database Stack (Simple + Future-Proof)

### 5.1 Phase 1 (No Backend)
1. Browser localStorage only
2. Stores mock booked slots and session details
3. Best for demos, pilot rollout, internal validation

### 5.2 Phase 2 (Production Multi-User) - Recommended Primary
Recommended for Netlify + React/Vite scale-up:
1. Supabase (PostgreSQL + Auth + REST APIs)
2. Tables:
  - users
  - bookings
  - slots
  - payments
  - coaching_packages
3. Why this is a good balance:
  - predictable free tier and low starting cost
  - strong SQL capabilities and migration support
  - easy team onboarding with dashboard + row-level security
  - mature ecosystem for auth and realtime needs

### 5.3 Cloudflare-Native Alternative (Reliable + Cost-Aware)
Use when deployment is on Cloudflare Pages/Workers:
1. Cloudflare D1 (SQLite-based serverless relational DB)
2. Cloudflare R2 for optional document/invoice assets
3. Cloudflare KV for non-critical cache/session hints
4. Why choose this path:
  - tight integration with Cloudflare edge runtime
  - low-latency reads for global users
  - simple operational model with one vendor

Reliability and tradeoff guidance:
1. For relational complexity and advanced SQL/reporting, Supabase Postgres is usually easier long-term.
2. For edge-first architecture and low infra overhead, Cloudflare D1 is a strong option.
3. If team is small and wants fastest delivery with least risk, start with Supabase.
4. If organization standardizes on Cloudflare and traffic is global, choose Cloudflare stack.

### 5.4 Practical Recommendation by Stage
1. Stage A (MVP/internal): localStorage only
2. Stage B (first real users): Netlify + Supabase
3. Stage C (edge/global optimization): Cloudflare Pages + Workers + D1 (or keep Supabase if SQL depth is priority)

### 5.5 Final Database Decision
1. Default database for this project: Supabase.
2. Neon is an optional advanced alternative only when a custom backend architecture is required.

## 6. Maintainability Requirements
1. Keep business rules in clearly named JS functions.
2. Keep UI rendering separated from pricing and validation logic.
3. Use constants for fees, tax, pricing, and colors.
4. Avoid external dependencies in phase 1.
5. Add concise inline comments only for complex logic.
6. Keep deployment config documented in README.

## 7. Acceptance Criteria
1. Fully functional single-page booking flow.
2. Correct court/coaching branching behavior.
3. Correct pricing and tax calculations.
4. Booking guard rules enforced.
5. Success and failure payment paths both handled.
6. Responsive and accessible on mobile and desktop.
7. No JavaScript runtime errors.

