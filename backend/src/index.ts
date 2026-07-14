import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes     from './routes/auth';
import slotsRoutes    from './routes/slots';
import bookingsRoutes from './routes/bookings';
import packagesRoutes from './routes/packages';

dotenv.config();

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Security middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50kb' }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/slots',    slotsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/packages', packagesRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[backend] Listening on http://localhost:${PORT}`);
  console.log(`[backend] Accepting requests from: ${process.env.FRONTEND_URL ?? 'http://localhost:5173'}`);
});
