import { Router } from 'express';
import { listSlotsForDate } from '../lib/database';

const router = Router();

// GET /api/slots?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const date = req.query.date as string;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'A valid date in YYYY-MM-DD format is required.' });
    return;
  }

  const slots = await listSlotsForDate(date);

  res.json({ slots });
});

export default router;
