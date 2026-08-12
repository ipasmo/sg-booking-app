import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes     from './routes/auth';
import slotsRoutes    from './routes/slots';
import bookingsRoutes from './routes/bookings';
import paymentsRoutes from './routes/payments';
import packagesRoutes from './routes/packages';
import sportsRoutes   from './routes/sports';
import configRoutes   from './routes/config';
import devRoutes      from './routes/dev';
import { isDatabaseConfigured } from './lib/database';

dotenv.config();

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

function parseAllowedOrigins(): string[] {
  const single = process.env.FRONTEND_URL ?? '';
  const multi = process.env.FRONTEND_URLS ?? '';
  const combined = [single, multi].filter(Boolean).join(',');

  return combined
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins();

// ── Security middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests and same-origin server-to-server checks.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.length === 0) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50kb' }));

// Prevent browsers/proxies/CDNs from caching API responses so clients always get fresh data.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/slots',    slotsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/sports',   sportsRoutes);
app.use('/api/config',   configRoutes);
app.use('/api/dev',      devRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      configured: isDatabaseConfigured(),
    },
  });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[backend] Listening on http://localhost:${PORT}`);
  console.log(`[backend] Accepting requests from: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'all origins (no FRONTEND_URL/FRONTEND_URLS configured)'}`);
});
