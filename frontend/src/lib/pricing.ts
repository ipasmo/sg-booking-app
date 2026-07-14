import { COURT_RATE, PACKAGES, PLATFORM_FEE, TAX_RATE } from './constants';

export function calcPricing(
  bookingType: string,
  durationMins: number,
  packageOption: string | null
) {
  let priceSubtotal = 0;

  if (bookingType === 'court') {
    priceSubtotal = parseFloat((COURT_RATE * (durationMins / 60)).toFixed(2));
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
