const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Fix #4
const {
  generateQuiz,
  submitQuiz,
  getProgress,
  generateCustomQuiz,
} = require('../controllers/quizController');

// Fix #4: Tất cả routes yêu cầu đăng nhập
router.use(protect);

// GET /api/quiz/generate/:setId?type=multiple-choice-vie|multiple-choice-en|fill-blank
router.get('/generate/:setId', generateQuiz);

// POST /api/quiz/generate-custom — Generate custom quiz
router.post('/generate-custom', generateCustomQuiz);

// POST /api/quiz/submit — Submit quiz answers and save progress
router.post('/submit', submitQuiz);

// GET /api/quiz/progress — Get quiz progress history
router.get('/progress', getProgress);

module.exports = router;
