import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/authMiddleware';
import { listBookingsByCustomer, saveBooking, SlotAlreadyBookedError, SlotConfigurationMissingError, type SportFacilityRow } from '../lib/database';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FACILITY_IMAGE_KEYS = new Set<SportFacilityRow['imageKey']>([
  'bowling-lane',
  'nets-2',
  'nets-3',
  'nets-4',
  'indoor-court',
  'outdoor-field',
]);

function toFacilityImageKey(value: string | null | undefined): SportFacilityRow['imageKey'] | null {
  const normalized = value?.trim();
  if (!normalized || !FACILITY_IMAGE_KEYS.has(normalized as SportFacilityRow['imageKey'])) {
    return null;
  }

  return normalized as SportFacilityRow['imageKey'];
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

// GET /api/bookings  (requires Bearer token)
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const email = req.user?.email;
  if (!email) {
    res.status(401).json({ error: 'Authorization token is required.' });
    return;
  }

  const bookings = await listBookingsByCustomer(normalizeEmail(email));
  res.json({ bookings });
});

// POST /api/bookings  (requires Bearer token)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const {
    bookingType, selectedDate, selectedTime, durationMins,
    packageOption, payMethod, grandTotal, receiptId, customerEmail: bodyCustomerEmail,
    facilityTitle, facilityAddress, facilityImageKey, facilityTag,
  } = req.body as {
    bookingType: string;
    selectedDate: string;
    selectedTime: string;
    durationMins: number;
    packageOption: string | null;
    payMethod: string;
    grandTotal: number;
    receiptId: string;
    customerEmail?: string;
    facilityTitle?: string | null;
    facilityAddress?: string | null;
    facilityImageKey?: string | null;
    facilityTag?: string | null;
  };

  const customerEmail = req.user?.email
    ? normalizeEmail(req.user.email)
    : bodyCustomerEmail
      ? normalizeEmail(bodyCustomerEmail)
      : undefined;

  // Validate required fields and return exact missing keys for easier client troubleshooting.
  const missingFields: string[] = [];
  if (!bookingType) missingFields.push('bookingType');
  if (!selectedDate) missingFields.push('selectedDate');
  if (!selectedTime) missingFields.push('selectedTime');
  if (!payMethod) missingFields.push('payMethod');
  if (!receiptId) missingFields.push('receiptId');
  if (!customerEmail) missingFields.push('customerEmail');
  if (!Number.isFinite(durationMins) || durationMins <= 0) missingFields.push('durationMins');
  if (!Number.isFinite(grandTotal) || grandTotal < 0) missingFields.push('grandTotal');
  if (customerEmail && !EMAIL_RE.test(customerEmail)) missingFields.push('customerEmail(valid format)');

  if (missingFields.length > 0) {
    res.status(400).json({
      error: `Missing or invalid booking fields: ${missingFields.join(', ')}.`,
    });
    return;
  }

  const resolvedCustomerEmail = customerEmail as string;

  const paymentSuccessful = Math.random() < 0.9;
  const bookingStatus = paymentSuccessful ? 'confirmed' : 'cash_pending';
  const paymentMethod = paymentSuccessful ? 'ONLINE' : 'CASH';

  try {
    await saveBooking({
      bookingType,
      selectedDate,
      selectedTime,
      durationMins,
      packageOption,
      payMethod,
      grandTotal,
      receiptId,
      customerEmail: resolvedCustomerEmail,
      bookingStatus,
      paymentMethod,
      facilityTitle: facilityTitle?.trim() || null,
      facilityAddress: facilityAddress?.trim() || null,
      facilityImageKey: toFacilityImageKey(facilityImageKey),
      facilityTag: facilityTag?.trim() || null,
    });
  } catch (error) {
    if (error instanceof SlotAlreadyBookedError) {
      res.status(409).json({
        error: 'This slot is already booked. Please select a different time slot.',
      });
      return;
    }

    if (error instanceof SlotConfigurationMissingError) {
      res.status(422).json({
        error: 'No weekday slot configuration found. Please contact admin to configure this weekday.',
      });
      return;
    }

    res.status(500).json({
      error: 'Unable to create booking at the moment. Please try again.',
    });
    return;
  }

  res.json({
    receiptId,
    status: paymentSuccessful ? 'success' : 'cash',
    paymentMethod,
  });
});

export default router;
