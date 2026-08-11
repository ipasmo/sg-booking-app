import { listPackages, listSportFacilities, type SportRow } from './database';

const PLATFORM_FEE = 1.50;
// Stripe charges 3.5% of (booking fee + platform fee)
const STRIPE_FEE_RATE = 0.035;

export type BookingPricingInput = {
  bookingType: string;
  durationMins: number;
  packageOption: string | null;
  sportId?: SportRow['id'] | null;
  facilityCode?: string | null;
  payMethod?: string | null;
};

export type BookingPricing = {
  priceSubtotal: number;
  tax: number;
  platformFee: number;
  grandTotal: number;
};

function parseMoneyLabel(value: string): number {
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid price label: ${value}`);
  }

  return parsed;
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export async function calculateBookingPricing(input: BookingPricingInput): Promise<BookingPricing> {
  let priceSubtotal = 0;

  if (input.bookingType === 'court') {
    if (!input.sportId || !input.facilityCode) {
      throw new Error('sportId and facilityCode are required for court bookings.');
    }

    const facilities = await listSportFacilities(input.sportId);
    const facility = facilities.find((item) => item.code === input.facilityCode);
    if (!facility) {
      throw new Error('Selected facility could not be found.');
    }

    const ratePerHour = parseMoneyLabel(facility.price);
    priceSubtotal = roundMoney(ratePerHour * (input.durationMins / 60));
  } else {
    const packages = await listPackages();
    const pkg = packages.find((item) => item.id === input.packageOption);
    if (!pkg) {
      throw new Error('Selected package could not be found.');
    }

    priceSubtotal = roundMoney(pkg.price);
  }

  const isCard = input.payMethod === 'STRIPE';
  const stripeFee = isCard ? roundMoney((priceSubtotal + PLATFORM_FEE) * STRIPE_FEE_RATE) : 0;
  const grandTotal = roundMoney(priceSubtotal + PLATFORM_FEE + stripeFee);

  return {
    priceSubtotal,
    tax: stripeFee,
    platformFee: PLATFORM_FEE,
    grandTotal,
  };
}