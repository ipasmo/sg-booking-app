import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

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

export default router;
