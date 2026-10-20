const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const docs = require('../controllers/documentController');

router.use(protect);
router.route('/:id').get(docs.get).put(docs.update).delete(docs.remove);

module.exports = router;