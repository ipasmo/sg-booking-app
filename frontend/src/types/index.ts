// ─────────────────────────────────────────────────────────────
// Shared application types
// ─────────────────────────────────────────────────────────────

export type Screen = 'home' | 'sport-select' | 'sport-events' | 'facility-select' | 'schedule' | 'login' | 'checkout' | 'success';
export type SportId = 'cricket' | 'indoor-cricket' | 'pickleball' | 'soccer' | 'volleyball' | 'badminton' | 'basketball' | 'kabaddi';
export type BookingType = 'court' | 'coaching';
export type PayMethod = 'STRIPE' | 'PAYNOW' | 'GRABPAY';

export interface Duration {
  label: string;
  value: number;
}

export interface Package {
  id: string;
  label: string;
  price: number;
  per: string;
}

export interface TimeSlot {
  time: string;
  key: string;
  booked: boolean;
}

export interface AppState {
  screen: Screen;
  bookingType: BookingType | null;
  selectedDate: string | null;     // ISO date: 'YYYY-MM-DD'
  selectedTime: string | null;     // 'HH:MM'
  durationMins: number;
  selectedSport: SportId | null;
  packageOption: string | null;
  isLoggedIn: boolean;
  customerEmail: string;
  authToken: string | null;
  payMethod: PayMethod | null;
  slots: TimeSlot[];
  slotsLoading: boolean;
  slotsError: string | null;
  priceSubtotal: number;
  platformFee: number;
  tax: number;
  grandTotal: number;
  receiptId: string;
  whatsAppMockSent: boolean;
  paymentError: string | null;
}

export type Action =
  | { type: 'SET_SCREEN'; payload: Screen }
  | { type: 'SET_BOOKING_TYPE'; payload: BookingType }
  | { type: 'SET_SELECTED_SPORT'; payload: SportId }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_TIME'; payload: string }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_PACKAGE'; payload: string | null }
  | { type: 'SET_PAY_METHOD'; payload: PayMethod }
  | { type: 'SET_LOGGED_IN'; payload: { email: string; token: string } }
  | { type: 'SET_SLOTS_LOADING' }
  | { type: 'SET_SLOTS'; payload: TimeSlot[] }
  | { type: 'SET_SLOTS_ERROR'; payload: string }
  | { type: 'CLEAR_SLOTS_ERROR' }
  | { type: 'SET_PRICING'; payload: { priceSubtotal: number; tax: number; platformFee: number; grandTotal: number } }
  | { type: 'SET_RECEIPT'; payload: string }
  | { type: 'SET_PAYMENT_ERROR'; payload: string | null }
  | { type: 'MARK_WHATSAPP_SENT' }
  | { type: 'RESET' };

export interface BookingPayload {
  bookingType: BookingType;
  selectedDate: string;
  selectedTime: string;
  durationMins: number;
  packageOption: string | null;
  payMethod: PayMethod;
  grandTotal: number;
  receiptId: string;
  customerEmail: string;
}

export interface LoginResponse {
  token: string;
  email: string;
}

export interface SlotsResponse {
  slots: TimeSlot[];
}

export interface BookingResponse {
  receiptId: string;
  status: string;
}
