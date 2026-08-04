import { createHash, randomBytes, webcrypto } from 'crypto';

const CLIENT_PAYLOAD_KEY = process.env.AUTH_PAYLOAD_KEY ?? 'dev-auth-payload-key-change-me';
const PASSWORD_AT_REST_KEY = process.env.PASSWORD_AT_REST_KEY ?? CLIENT_PAYLOAD_KEY;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64'));
}

function deriveAesKey(secret: string) {
  const hash = createHash('sha256').update(secret, 'utf8').digest();
  return webcrypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptPasswordAtRest(plainPassword: string): Promise<string> {
  const key = await deriveAesKey(PASSWORD_AT_REST_KEY);
  const iv = randomBytes(12);
  const encrypted = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    Buffer.from(plainPassword, 'utf8')
  );

  return `v1.${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
}

async function decryptWithSecret(payload: string, secret: string): Promise<string> {
  const [version, ivB64, cipherB64] = payload.split('.');
  if (version !== 'v1' || !ivB64 || !cipherB64) {
    throw new Error('Invalid encrypted payload format.');
  }

  const key = await deriveAesKey(secret);
  const decrypted = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(ivB64) },
    key,
    fromBase64(cipherB64)
  );

  return Buffer.from(decrypted).toString('utf8');
}

export async function decryptClientPasswordPayload(payload: string): Promise<string> {
  return decryptWithSecret(payload, CLIENT_PAYLOAD_KEY);
}

export async function decryptPasswordAtRest(payload: string): Promise<string> {
  return decryptWithSecret(payload, PASSWORD_AT_REST_KEY);
}
