import { COURT_RATE, PACKAGES, PLATFORM_FEE, TAX_RATE } from './constants';

export function calcPricing(
  bookingType: string,
  durationMins: number,
  packageOption: string | null,
  ratePerHour = COURT_RATE
) {
  let priceSubtotal = 0;

  if (bookingType === 'court') {
    priceSubtotal = parseFloat((ratePerHour * (durationMins / 60)).toFixed(2));
  } else {
    const pkg = PACKAGES.find(p => p.id === packageOption);
    priceSubtotal = pkg ? pkg.price : 0;
  }

  const platformFee = PLATFORM_FEE;
  const tax         = parseFloat((priceSubtotal * TAX_RATE).toFixed(2));
  const grandTotal  = parseFloat((priceSubtotal + tax + platformFee).toFixed(2));

  return { priceSubtotal, tax, platformFee, grandTotal };
}

export function sgd(n: number): string {
  return `SGD ${Number(n).toFixed(2)}`;
}

export function parseRate(price: string | number | null | undefined, fallback = COURT_RATE): number {
  if (typeof price === 'number') {
    return Number.isFinite(price) && price > 0 ? price : fallback;
  }

  if (!price) {
    return fallback;
  }

  const parsed = Number(String(price).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
