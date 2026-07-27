import { Router } from 'express';
import { listPackages } from '../lib/database';

const router = Router();

// GET /api/packages
router.get('/', async (_req, res) => {
  const packages = await listPackages();
  res.json({ packages });
});

export default router;
