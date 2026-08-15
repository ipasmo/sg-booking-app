import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '').trim();

const isLiveStripeKeyOverHttp =
  STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_') && window.location.protocol !== 'https:';

if (isLiveStripeKeyOverHttp) {
  console.warn('[stripe] A live publishable key requires HTTPS. Stripe card payments are disabled.');
}

export const stripePublishableKey = isLiveStripeKeyOverHttp ? '' : STRIPE_PUBLISHABLE_KEY;
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;
