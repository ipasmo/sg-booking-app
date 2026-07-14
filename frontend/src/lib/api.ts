import type { BookingPayload, BookingResponse, LoginResponse, SlotsResponse } from '@/types';
import { markLocalBooked, mergeWithLocalBooked } from './localBookedSlots';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ─── Slots ────────────────────────────────────────────────────

export async function fetchSlots(date: string): Promise<SlotsResponse> {
  const response = await request<SlotsResponse>(`/api/slots?date=${encodeURIComponent(date)}`);
  return {
    slots: mergeWithLocalBooked(date, response.slots),
  };
}

// ─── Bookings ─────────────────────────────────────────────────

export async function createBooking(
  payload: BookingPayload,
  token: string
): Promise<BookingResponse> {
  const response = await request<BookingResponse>('/api/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  // Fallback persistence for demo / non-Supabase mode.
  markLocalBooked(payload.selectedDate, payload.selectedTime);

  return response;
}
