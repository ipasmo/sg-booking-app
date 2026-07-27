# ─────────────────────────────────────────────────────────────
# SportyGo Booking App — Dockerfile
# Serves the single-file static app via Nginx Alpine.
# Same image works for local development and production.
# ─────────────────────────────────────────────────────────────

FROM nginx:alpine

# Copy static app
COPY index.html /usr/share/nginx/html/index.html

# Copy custom Nginx config (SPA fallback + cache headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
