const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { protect, adminOnly } = require('../middlewares/auth');

router.get('/me', protect, resultController.getMyResults);
router.get('/:id', protect, resultController.getSubmissionDetails);
router.get('/', protect, adminOnly, resultController.getAllResults);

module.exports = router;
