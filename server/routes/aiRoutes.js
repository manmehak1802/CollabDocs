const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const ai = require('../controllers/aiController');

// Max 10 AI requests per minute per user, to protect the free quota
const hits = new Map();
const limiter = (req, res, next) => {
  const key = String(req.user._id);
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < 60000);
  if (recent.length >= 10)
    return res.status(429).json({ message: 'Too many AI requests. Wait a minute.' });
  recent.push(now);
  hits.set(key, recent);
  next();
};

router.use(protect);
router.post('/ask', limiter, ai.ask);
router.post('/workspaces/:id/reindex', limiter, ai.reindex);

module.exports = router;