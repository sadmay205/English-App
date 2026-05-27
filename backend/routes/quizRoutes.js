const express = require('express');
const router = express.Router();
const {
  generateQuiz,
  submitQuiz,
  getProgress,
} = require('../controllers/quizController');

// GET /api/quiz/generate/:setId?type=multiple-choice|fill-blank
router.get('/generate/:setId', generateQuiz);

// POST /api/quiz/submit — Submit quiz answers and save progress
router.post('/submit', submitQuiz);

// GET /api/quiz/progress — Get quiz progress history
router.get('/progress', getProgress);

module.exports = router;
