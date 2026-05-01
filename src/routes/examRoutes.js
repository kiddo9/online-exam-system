const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const questionController = require('../controllers/questionController');
const { protect, adminOnly } = require('../middlewares/auth');

// Exam routes
router.get('/', protect, examController.getAllExams);
router.get('/:id', protect, examController.getExamById);
router.post('/', protect, adminOnly, examController.createExam);
router.patch('/:id/publish', protect, adminOnly, examController.publishExam);

// Question routes (associated with exams)
router.post('/:id/questions', protect, adminOnly, questionController.addQuestion);
router.get('/:id/questions', protect, questionController.getExamQuestions);

// Exam attempt routes
router.post('/:id/start', protect, examController.startExam);
router.post('/:id/submit', protect, examController.submitExam);

module.exports = router;
