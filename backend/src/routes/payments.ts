import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/authMiddleware';
import { getStripeClient, isStripeConfigured, toMinorCurrencyUnits } from '../lib/stripe';
import { calculateBookingPricing } from '../lib/bookingPricing';
import { type SportRow } from '../lib/database';

const router = Router();
const DEFAULT_CURRENCY = (process.env.STRIPE_CURRENCY ?? 'sgd').trim().toLowerCase();

// POST /api/payments/stripe/payment-intent (requires Bearer token)
router.post('/stripe/payment-intent', authMiddleware, async (req: AuthenticatedRequest, res) => {
  if (!isStripeConfigured()) {
    res.status(503).json({
      error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY on backend.',
    });
    return;
  }

  const customerEmail = req.user?.email?.trim().toLowerCase();
  if (!customerEmail) {
    res.status(401).json({ error: 'Authorization token is required.' });
    return;
  }

  const { bookingType, sportId, facilityCode, durationMins, packageOption, currency, receiptId } = req.body as {
    bookingType?: string;
    sportId?: SportRow['id'] | null;
    facilityCode?: string | null;
    durationMins?: number;
    packageOption?: string | null;
    currency?: string;
    receiptId?: string;
  };

  if (!bookingType) {
    res.status(400).json({ error: 'bookingType is required.' });
    return;
  }

  if (!Number.isFinite(durationMins) || (durationMins as number) <= 0) {
    res.status(400).json({ error: 'durationMins must be a positive number.' });
    return;
  }

  const pricing = await calculateBookingPricing({
    bookingType,
    sportId,
    facilityCode,
    durationMins: durationMins as number,
    packageOption: packageOption ?? null,
    payMethod: 'STRIPE',
  }).catch((error) => {
    const message = error instanceof Error ? error.message : 'Unable to calculate booking amount.';
    res.status(400).json({ error: message });
    return null;
  });

  if (!pricing) {
    return;
  }

  const amountInMinor = toMinorCurrencyUnits(pricing.grandTotal);
  if (amountInMinor <= 0) {
    res.status(400).json({ error: 'Amount must be at least 0.01.' });
    return;
  }

  const normalizedCurrency = (currency ?? DEFAULT_CURRENCY).trim().toLowerCase();

  try {
    const stripe = getStripeClient();
    const intent = await stripe.paymentIntents.create({
      amount: amountInMinor,
      currency: normalizedCurrency,
      receipt_email: customerEmail,
      automatic_payment_methods: { enabled: true },
      metadata: {
        receiptId: receiptId?.trim() ?? '',
        customerEmail,
        bookingType,
        sportId: sportId ?? '',
        facilityCode: facilityCode ?? '',
        durationMins: String(durationMins),
        packageOption: packageOption ?? '',
      },
    });

    if (!intent.client_secret) {
      res.status(500).json({ error: 'Unable to initialize Stripe payment.' });
      return;
    }

    res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe payment initialization failed.';
    res.status(502).json({ error: message });
  }
});

export default router;
