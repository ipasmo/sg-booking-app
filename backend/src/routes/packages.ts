import { Router } from 'express';

const router = Router();

const PACKAGES = [
  { id: 'single',  label: 'Single Session',  price: 120, per: 'SGD 120.00 / session' },
  { id: 'pack3',   label: '3-Session Pack',  price: 88,  per: 'SGD 29.33 / session'  },
  { id: 'pack10',  label: '10-Session Pack', price: 250, per: 'SGD 25.00 / session'  },
  { id: 'pack15',  label: '15-Session Pack', price: 350, per: 'SGD 23.33 / session'  },
  { id: 'pack20',  label: '20-Session Pack', price: 450, per: 'SGD 22.50 / session'  },
];

// GET /api/packages
router.get('/', (_req, res) => {
  res.json({ packages: PACKAGES });
});

export default router;
