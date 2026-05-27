const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Fix #4
const { chat } = require('../controllers/aiController');

// Fix #4: AI routes yêu cầu đăng nhập
router.use(protect);

// POST /api/ai/chat - Send chat message to AI tutor
router.post('/chat', chat);

module.exports = router;
