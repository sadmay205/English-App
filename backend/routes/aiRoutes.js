const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/aiController');

// POST /api/ai/chat - Send chat message to AI tutor
router.post('/chat', chat);

module.exports = router;
