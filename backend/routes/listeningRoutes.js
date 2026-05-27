const express = require('express');
const router = express.Router();
const {
  processParagraph,
  getAllTasks,
  getTaskById,
  deleteTask,
} = require('../controllers/listeningController');

// POST /api/listening/process-paragraph - Create listening task from paragraph
router.post('/process-paragraph', processParagraph);

// GET /api/listening/tasks - Get all listening tasks
router.get('/tasks', getAllTasks);

// GET /api/listening/tasks/:id - Get a specific listening task
router.get('/tasks/:id', getTaskById);

// DELETE /api/listening/tasks/:id - Delete a specific listening task
router.delete('/tasks/:id', deleteTask);

module.exports = router;
