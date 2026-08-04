import { decryptLocalValue, encryptLocalValue } from './authCrypto';

const REMEMBERED_AUTH_KEY = 'sg_booking_app_remembered_auth_v1';

type RememberedAuth = {
  email: string;
  password: string;
};

export async function saveRememberedAuth(input: RememberedAuth): Promise<void> {
  try {
    const encrypted = await encryptLocalValue(JSON.stringify(input));
    localStorage.setItem(REMEMBERED_AUTH_KEY, encrypted);
  } catch {
    // Ignore browser storage restrictions.
  }
}

export function clearRememberedAuth(): void {
  try {
    localStorage.removeItem(REMEMBERED_AUTH_KEY);
  } catch {
    // Ignore browser storage restrictions.
  }
}

export async function readRememberedAuth(): Promise<RememberedAuth | null> {
  try {
    const stored = localStorage.getItem(REMEMBERED_AUTH_KEY);
    if (!stored) return null;

    const decoded = await decryptLocalValue(stored);
    const parsed = JSON.parse(decoded) as Partial<RememberedAuth>;
    if (!parsed.email || !parsed.password) return null;

    return {
      email: String(parsed.email),
      password: String(parsed.password),
    };
  } catch {
    return null;
  }
}
