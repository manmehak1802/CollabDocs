const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const x = require('../controllers/extraController');

router.get('/documents/recent', protect, x.recentDocs);
router.put('/auth/me', protect, x.updateProfile);
router.put('/workspaces/:id/members/:userId', protect, x.changeRole);
router.put('/workspaces/:id/settings', protect, x.updateSettings);

module.exports = router;