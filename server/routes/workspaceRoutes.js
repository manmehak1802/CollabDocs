const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const ws = require('../controllers/workspaceController');
const docs = require('../controllers/documentController');

router.use(protect);

router.route('/').post(ws.create).get(ws.list);
router.get('/:id', ws.get);
router.post('/:id/members', ws.addMember);
router.delete('/:id/members/:userId', ws.removeMember);

router.route('/:workspaceId/documents').post(docs.create).get(docs.listByWorkspace);

module.exports = router;