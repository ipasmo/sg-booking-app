const AUTH_PAYLOAD_KEY = import.meta.env.VITE_AUTH_PAYLOAD_KEY ?? 'dev-auth-payload-key-change-me';

function toBase64(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = '';
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const encoded = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptWithSecret(value: string, secret: string): Promise<string> {
  const key = await deriveAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payloadBytes = new TextEncoder().encode(value);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payloadBytes);
  return `v1.${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
}

async function decryptWithSecret(payload: string, secret: string): Promise<string> {
  const [version, ivB64, cipherB64] = payload.split('.');
  if (version !== 'v1' || !ivB64 || !cipherB64) {
    throw new Error('Invalid encrypted payload format.');
  }

  const key = await deriveAesKey(secret);
  const iv = fromBase64(ivB64);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    fromBase64(cipherB64)
  );

  return new TextDecoder().decode(decrypted);
}

export function encryptPasswordForTransport(password: string): Promise<string> {
  return encryptWithSecret(password, AUTH_PAYLOAD_KEY);
}

export function encryptLocalValue(value: string): Promise<string> {
  return encryptWithSecret(value, AUTH_PAYLOAD_KEY);
}

export function decryptLocalValue(payload: string): Promise<string> {
  return decryptWithSecret(payload, AUTH_PAYLOAD_KEY);
}
