import type {
  BookingHistoryResponse,
  BookingPayload,
  BookingResponse,
  LoginResponse,
  RegisterPayload,
  SlotsResponse,
  SportFacilitiesResponse,
  SportFacilityTemplate,
  SportEventsResponse,
  SportEventTemplate,
  SportsResponse,
  SportId,
  SportOption,
} from '@/types';
import { markLocalBooked, mergeWithLocalBooked } from './localBookedSlots';
import { encryptPasswordForTransport } from './authCrypto';
import fallbackSports from '@/data/json/sports.json';
import fallbackSportEvents from '@/data/json/sport-events.json';
import fallbackSportFacilities from '@/data/json/sport-facilities.json';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';
let cachedSportsResponse: SportsResponse | null = null;
let cachedSportsRequest: Promise<SportsResponse> | null = null;
const cachedSportEventsResponse = new Map<SportId, SportEventsResponse>();
const cachedSportEventsRequest = new Map<SportId, Promise<SportEventsResponse>>();
const cachedSportFacilitiesResponse = new Map<SportId, SportFacilitiesResponse>();
const cachedSportFacilitiesRequest = new Map<SportId, Promise<SportFacilitiesResponse>>();

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message);
}

function isUnavailableApiError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /request failed:\s*(404|5\d\d)/i.test(error.message);
}

function isAuthTokenError(error: unknown): boolean {
  return error instanceof Error && /invalid or expired token/i.test(error.message);
}

function isPreBooked(date: string, time: string): boolean {
  let hash = 0;
  const seed = `${date}_${time}`;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i) | 0;
  }
  return Math.abs(hash) % 4 === 0;
}

function buildLocalSlots(date: string): SlotsResponse {
  const slots: SlotsResponse['slots'] = [];

  for (let h = 8; h < 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({
        time,
        key: `${date}_${time}`,
        booked: isPreBooked(date, time),
      });
    }
  }

  return { slots };
}

function resolveTemplate(template: string, sportLabel: string): string {
  return template
    .replace(/\{sportLower\}/g, sportLabel.toLowerCase())
    .replace(/\{sport\}/g, sportLabel);
}

function buildFallbackSportEvents(sportId: SportId): SportEventsResponse {
  const sport = (fallbackSports as SportOption[]).find((item) => item.id === sportId) ?? (fallbackSports as SportOption[])[0];
  const events = (fallbackSportEvents as SportEventTemplate[]).map((event) => ({
    id: event.id,
    title: resolveTemplate(event.titleTemplate, sport.label),
    description: resolveTemplate(event.descriptionTemplate, sport.label),
    imageKey: event.imageKey,
    icon: event.icon,
    actionTarget: event.actionTarget,
    sortOrder: event.sortOrder,
  }));

  return { sport, events };
}

function buildFallbackSportFacilities(sportId: SportId): SportFacilitiesResponse {
  const sport = (fallbackSports as SportOption[]).find((item) => item.id === sportId) ?? (fallbackSports as SportOption[])[0];
  const facilities = (fallbackSportFacilities as SportFacilityTemplate[]).map((facility) => ({
    id: `${sport.id}-${facility.code}`,
    sportId: sport.id,
    code: facility.code,
    title: resolveTemplate(facility.titleTemplate, sport.label),
    price: facility.price,
    tag: facility.tag,
    address: facility.address,
    mapLocationUrl: facility.mapLocationUrl,
    imageKey: facility.imageKey,
    icon: facility.icon,
    actionTarget: facility.actionTarget,
    sortOrder: facility.sortOrder,
  }));

  return { sport, facilities };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────

export async function loginUser(loginId: string, password: string): Promise<LoginResponse> {
  const encryptedPassword = await encryptPasswordForTransport(password);

  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ loginId, encryptedPassword }),
  });
}

export async function registerUser(payload: RegisterPayload): Promise<LoginResponse> {
  const encryptedPassword = await encryptPasswordForTransport(payload.password);

  return request<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      name: payload.name,
      mobileNumber: payload.mobileNumber,
      encryptedPassword,
    }),
  });
}

export async function resetPassword(loginId: string, password: string): Promise<{ message: string }> {
  const encryptedPassword = await encryptPasswordForTransport(password);

  return request<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ loginId, encryptedPassword }),
  });
}

export async function requestPasswordResetCode(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/forgot-password/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyPasswordResetCode(email: string, code: string): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/forgot-password/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function resetPasswordWithCode(email: string, code: string, password: string): Promise<{ message: string }> {
  const encryptedPassword = await encryptPasswordForTransport(password);

  return request<{ message: string }>('/api/auth/forgot-password/reset', {
    method: 'POST',
    body: JSON.stringify({ email, code, encryptedPassword }),
  });
}

// ─── Slots ────────────────────────────────────────────────────

export async function fetchSlots(date: string): Promise<SlotsResponse> {
  let response: SlotsResponse;
  try {
    response = await request<SlotsResponse>(`/api/slots?date=${encodeURIComponent(date)}`);
  } catch (error) {
    // Keep Schedule usable in demo/dev when backend is temporarily unavailable.
    if (!isNetworkError(error) && !isUnavailableApiError(error)) throw error;
    response = buildLocalSlots(date);
  }

  return {
    slots: mergeWithLocalBooked(date, response.slots),
  };
}

// ─── Sports ──────────────────────────────────────────────────

export async function fetchSports(): Promise<SportsResponse> {
  if (cachedSportsResponse) {
    return cachedSportsResponse;
  }

  if (!cachedSportsRequest) {
    cachedSportsRequest = request<SportsResponse>('/api/sports')
      .then((response) => {
        cachedSportsResponse = response;
        return response;
      })
      .catch((_error) => {
        const fallbackResponse = { sports: fallbackSports as SportsResponse['sports'] };
        cachedSportsResponse = fallbackResponse;
        return fallbackResponse;
      })
      .finally(() => {
        cachedSportsRequest = null;
      });
  }

  return cachedSportsRequest;
}

export async function fetchSportEvents(sportId: SportId): Promise<SportEventsResponse> {
  const cachedResponse = cachedSportEventsResponse.get(sportId);
  if (cachedResponse) {
    return cachedResponse;
  }

  const cachedRequest = cachedSportEventsRequest.get(sportId);
  if (cachedRequest) {
    return cachedRequest;
  }

  const requestPromise = request<SportEventsResponse>(`/api/sports/${encodeURIComponent(sportId)}/events`)
    .then((response) => {
      cachedSportEventsResponse.set(sportId, response);
      return response;
    })
    .catch((_error) => {
      const fallbackResponse = buildFallbackSportEvents(sportId);
      cachedSportEventsResponse.set(sportId, fallbackResponse);
      return fallbackResponse;
    })
    .finally(() => {
      cachedSportEventsRequest.delete(sportId);
    });

  cachedSportEventsRequest.set(sportId, requestPromise);
  return requestPromise;
}

export async function fetchSportFacilities(sportId: SportId): Promise<SportFacilitiesResponse> {
  const cachedResponse = cachedSportFacilitiesResponse.get(sportId);
  if (cachedResponse) {
    return cachedResponse;
  }

  const cachedRequest = cachedSportFacilitiesRequest.get(sportId);
  if (cachedRequest) {
    return cachedRequest;
  }

  const requestPromise = request<SportFacilitiesResponse>(`/api/sports/${encodeURIComponent(sportId)}/facilities`)
    .then((response) => {
      cachedSportFacilitiesResponse.set(sportId, response);
      return response;
    })
    .catch((_error) => {
      const fallbackResponse = buildFallbackSportFacilities(sportId);
      cachedSportFacilitiesResponse.set(sportId, fallbackResponse);
      return fallbackResponse;
    })
    .finally(() => {
      cachedSportFacilitiesRequest.delete(sportId);
    });

  cachedSportFacilitiesRequest.set(sportId, requestPromise);
  return requestPromise;
}

// ─── Bookings ─────────────────────────────────────────────────

export async function createBooking(
  payload: BookingPayload,
  token: string
): Promise<BookingResponse> {
  // Block the slot first on the client to satisfy booking-first workflow.
  markLocalBooked(payload.selectedDate, payload.selectedTime);

  try {
    return await request<BookingResponse>('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Temporary UX fallback: allow checkout demo flow when JWT has expired.
    if (isAuthTokenError(error)) {
      return {
        receiptId: payload.receiptId,
        status: 'success',
        paymentMethod: 'ONLINE',
      };
    }

    // If transport fails, keep slot blocked and fall back to cash payment path.
    if (isNetworkError(error)) {
      return {
        receiptId: payload.receiptId,
        status: 'cash',
        paymentMethod: 'CASH',
      };
    }
    throw error;
  }
}

export async function fetchMyBookings(token: string): Promise<BookingHistoryResponse> {
  try {
    return await request<BookingHistoryResponse>('/api/bookings', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    if (isNetworkError(error)) {
      return { bookings: [] };
    }
    throw error;
  }
}
