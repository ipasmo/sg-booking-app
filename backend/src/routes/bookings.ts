import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const router = Router();

// POST /api/bookings  (requires Bearer token)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const {
    bookingType, selectedDate, selectedTime, durationMins,
    packageOption, payMethod, grandTotal, receiptId, customerEmail,
  } = req.body as {
    bookingType: string;
    selectedDate: string;
    selectedTime: string;
    durationMins: number;
    packageOption: string | null;
    payMethod: string;
    grandTotal: number;
    receiptId: string;
    customerEmail: string;
  };

  // Validate required fields
  if (!bookingType || !selectedDate || !selectedTime || !payMethod || !receiptId) {
    res.status(400).json({ error: 'Missing required booking fields.' });
    return;
  }

  const paymentSuccessful = Math.random() < 0.9;
  const bookingStatus = paymentSuccessful ? 'confirmed' : 'cash_pending';
  const paymentMethod = paymentSuccessful ? 'ONLINE' : 'CASH';

  // Persist to Supabase when configured.
  // Business rule: block slot first, then process payment outcome.
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('slots').upsert({
        slot_date: selectedDate,
        slot_time: selectedTime,
        is_booked: true,
      }, { onConflict: 'slot_date,slot_time' });

      await supabase.from('bookings').insert({
        booking_type:   bookingType,
        slot_date:      selectedDate,
        slot_time:      selectedTime,
        duration_mins:  durationMins,
        package_id:     packageOption,
        pay_method:     payMethod,
        grand_total:    grandTotal,
        receipt_id:     receiptId,
        customer_email: customerEmail,
        status:         bookingStatus,
      });
    } catch {
      // Do not block demo flow if DB write fails.
    }
  }

  res.json({
    receiptId,
    status: paymentSuccessful ? 'success' : 'cash',
    paymentMethod,
  });
});

export default router;
