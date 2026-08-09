import { Router } from 'express';
import { listSlotsForDate, SlotConfigurationMissingError } from '../lib/database';

const router = Router();

// GET /api/slots?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const date = req.query.date as string;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'A valid date in YYYY-MM-DD format is required.' });
    return;
  }

  try {
    const slots = await listSlotsForDate(date);

    res.json({ slots });
  } catch (error) {
    if (error instanceof SlotConfigurationMissingError) {
      res.status(422).json({
        error: 'No weekday slot configuration found. Please configure start/end time for this weekday.',
      });
      return;
    }

    res.status(500).json({
      error: 'Unable to load slots at the moment. Please try again.',
    });
  }
});

export default router;
