import type { Duration, Package } from '@/types';

export const COURT_RATE   = 28;    // SGD per hour
export const PLATFORM_FEE = 1.50;  // fixed SGD
export const TAX_RATE     = 0.09;  // 9% GST

export const DURATIONS: Duration[] = [
  { label: '60 mins', value: 60  },
  { label: '90 mins', value: 90  },
  { label: '120 mins', value: 120 },
];

export const PACKAGES: Package[] = [
  { id: 'single',  label: 'Single Session',  price: 120, per: 'SGD 120.00 / session' },
  { id: 'pack3',   label: '3-Session Pack',  price: 88,  per: 'SGD 29.33 / session'  },
  { id: 'pack10',  label: '10-Session Pack', price: 250, per: 'SGD 25.00 / session'  },
  { id: 'pack15',  label: '15-Session Pack', price: 350, per: 'SGD 23.33 / session'  },
  { id: 'pack20',  label: '20-Session Pack', price: 450, per: 'SGD 22.50 / session'  },
];

export const PAY_OPTS = ['STRIPE', 'GPAY', 'PAYNOW', 'GRABPAY'] as const;

export const ALL_SCREENS = ['home', 'sport-select', 'sport-events', 'facility-select', 'schedule', 'terms', 'login', 'checkout', 'booking-confirmation'] as const;
