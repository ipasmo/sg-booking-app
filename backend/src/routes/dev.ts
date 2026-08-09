import { Router } from 'express';
// import { isDatabaseConfigured, resetDatabaseAndSeed } from '../lib/database';

const router = Router();

// POST /api/dev/reset-seed
// Dev-only helper to quickly reset + reseed DB for QA flows.
// router.post('/reset-seed', async (req, res) => {
//   if (process.env.NODE_ENV === 'production') {
//     res.status(403).json({ error: 'This endpoint is disabled in production.' });
//     return;
//   }

//   if (!isDatabaseConfigured()) {
//     res.status(400).json({ error: 'DATABASE_URL is not configured.' });
//     return;
//   }

//   const configuredToken = process.env.DEV_RESET_TOKEN;
//   if (configuredToken) {
//     const token = req.header('x-dev-reset-token');
//     if (!token || token !== configuredToken) {
//       res.status(401).json({ error: 'Invalid dev reset token.' });
//       return;
//     }
//   }

//   const requestedDays = Number(req.body?.days ?? 30);
//   const days = Number.isFinite(requestedDays) && requestedDays > 0 ? Math.min(180, Math.floor(requestedDays)) : 30;

//   // await resetDatabaseAndSeed(); DO NOT ENABLE THIS IN PRODUCTION. This is a dev-only endpoint for QA flows.
//   res.json({ ok: true, message: 'Database reset and seed completed.', days });
// });

export default router;
