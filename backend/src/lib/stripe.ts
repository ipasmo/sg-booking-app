import Stripe from 'stripe';

const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY ?? '').trim();

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return STRIPE_SECRET_KEY.length > 0;
}

export function getStripeClient(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in backend environment variables.');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

export function toMinorCurrencyUnits(amountMajor: number): number {
  return Math.round(amountMajor * 100);
}
