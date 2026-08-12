import { randomUUID } from 'crypto';
import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/authMiddleware';
import { listSlotsForDate, reserveSlot, releaseReservation, SlotConfigurationMissingError, SlotAlreadyBookedError, SlotReservedError } from '../lib/database';

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

// POST /api/slots/reserve  — temporarily reserves a slot before payment
router.post('/reserve', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const customerEmail = req.user?.email?.trim().toLowerCase();
  if (!customerEmail) {
    res.status(401).json({ error: 'Authorization token is required.' });
    return;
  }

  const { selectedDate, selectedTime, durationMins } = req.body as {
    selectedDate?: string;
    selectedTime?: string;
    durationMins?: number;
  };

  if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    res.status(400).json({ error: 'Valid selectedDate (YYYY-MM-DD) is required.' });
    return;
  }

  if (!selectedTime || !/^\d{2}:\d{2}$/.test(selectedTime)) {
    res.status(400).json({ error: 'Valid selectedTime (HH:MM) is required.' });
    return;
  }

  if (!Number.isFinite(durationMins) || (durationMins as number) <= 0) {
    res.status(400).json({ error: 'Valid durationMins is required.' });
    return;
  }

  const lockToken = randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  try {
    await reserveSlot(selectedDate, selectedTime, durationMins as number, customerEmail, lockToken);
    res.json({ lockToken, expiresAt });
  } catch (error) {
    if (error instanceof SlotAlreadyBookedError) {
      res.status(409).json({ error: 'This slot is no longer available. Please select a different time.' });
      return;
    }

    if (error instanceof SlotReservedError) {
      res.status(409).json({ error: 'This slot is being reserved by another user. Please try again shortly.' });
      return;
    }

    res.status(500).json({ error: 'Unable to reserve slot. Please try again.' });
  }
});

// POST /api/slots/release  — releases a reservation (best-effort, e.g. on payment failure)
router.post('/release', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const customerEmail = req.user?.email?.trim().toLowerCase();
  if (!customerEmail) {
    res.status(401).json({ error: 'Authorization token is required.' });
    return;
  }

  const { lockToken } = req.body as { lockToken?: string };
  if (!lockToken) {
    res.status(400).json({ error: 'lockToken is required.' });
    return;
  }

  await releaseReservation(lockToken, customerEmail).catch(() => undefined);
  res.json({ ok: true });
});

export default router;
