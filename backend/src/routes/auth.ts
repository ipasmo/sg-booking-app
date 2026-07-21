import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const router = Router();

const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID || undefined);

router.post('/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'A valid email address is required.' });
    return;
  }

  if (!password || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters.' });
    return;
  }

  // Phase 1: Accept any valid email + 8+ char password (no user DB needed)
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, email });
});

router.post('/google', async (req, res) => {
  const { credential } = req.body as { credential?: string };

  if (!GOOGLE_CLIENT_ID) {
    res.status(500).json({ error: 'Google authentication is not configured on the server.' });
    return;
  }

  if (!credential) {
    res.status(400).json({ error: 'Google credential token is required.' });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'Unable to verify Google account email.' });
      return;
    }

    const token = jwt.sign({ email, provider: 'google' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, email });
  } catch {
    res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
  }
});

export default router;
