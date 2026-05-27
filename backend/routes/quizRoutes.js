const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Fix #4
const {
  generateQuiz,
  submitQuiz,
  getProgress,
} = require('../controllers/quizController');

// Fix #4: Tất cả routes yêu cầu đăng nhập
router.use(protect);

// GET /api/quiz/generate/:setId?type=multiple-choice|fill-blank
router.get('/generate/:setId', generateQuiz);

// POST /api/quiz/submit — Submit quiz answers and save progress
router.post('/submit', submitQuiz);

// GET /api/quiz/progress — Get quiz progress history
router.get('/progress', getProgress);

module.exports = router;
