import { PACKAGES, PLATFORM_FEE, STRIPE_FEE_RATE } from './constants';

export function calcPricing(
  bookingType: string,
  durationMins: number,
  packageOption: string | null,
  ratePerHour = 0,
  payMethod?: string | null
) {
  let priceSubtotal = 0;

  if (bookingType === 'court') {
    priceSubtotal = parseFloat((ratePerHour * (durationMins / 60)).toFixed(2));
  } else {
    const pkg = PACKAGES.find(p => p.id === packageOption);
    priceSubtotal = pkg ? pkg.price : 0;
  }

  const platformFee = PLATFORM_FEE;
  const isCard = payMethod === 'STRIPE';
  const tax = isCard
    ? parseFloat(((priceSubtotal + platformFee) * STRIPE_FEE_RATE).toFixed(2))
    : 0;
  const grandTotal = parseFloat((priceSubtotal + platformFee + tax).toFixed(2));

  return { priceSubtotal, tax, platformFee, grandTotal };
}

export function sgd(n: number): string {
  return `SGD ${Number(n).toFixed(2)}`;
}

export function parseRate(price: string | number | null | undefined): number {
  if (typeof price === 'number') {
    return Number.isFinite(price) && price > 0 ? price : 0;
  }

  if (!price) {
    return 0;
  }

  const parsed = Number(String(price).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
