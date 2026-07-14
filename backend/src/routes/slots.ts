import { Router } from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const router = Router();

/**
 * Deterministic slot pre-booking seed — same date+time always returns the same result.
 * ~25% of slots are pre-marked booked using a hash of the date+time string.
 */
function isPreBooked(dateStr: string, time: string): boolean {
  let hash = 0;
  const str = `${dateStr}_${time}`;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return Math.abs(hash) % 4 === 0; // ~25%
}

function generateAllSlots(dateStr: string) {
  const slots: Array<{ time: string; key: string; booked: boolean }> = [];
  for (let h = 8; h < 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({ time, key: `${dateStr}_${time}`, booked: isPreBooked(dateStr, time) });
    }
  }
  return slots;
}

// GET /api/slots?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  const date = req.query.date as string;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'A valid date in YYYY-MM-DD format is required.' });
    return;
  }

  const slots = generateAllSlots(date);

  // Merge with actual DB bookings if Supabase is configured
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('slots')
        .select('slot_time')
        .eq('slot_date', date)
        .eq('is_booked', true);

      if (data && data.length > 0) {
        const bookedTimes = new Set(
          // Supabase stores time as 'HH:MM:SS', strip seconds
          data.map((s: { slot_time: string }) => s.slot_time.slice(0, 5))
        );
        slots.forEach(slot => {
          if (bookedTimes.has(slot.time)) slot.booked = true;
        });
      }
    } catch {
      // DB unavailable — fall back to deterministic mock data
    }
  }

  res.json({ slots });
});

export default router;
