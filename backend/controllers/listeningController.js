const ListeningTask = require('../models/ListeningTask');
const { splitParagraphIntoSentences } = require('../utils/textSplitter');

/**
 * @desc    Process a new paragraph, split it into sentences and create a listening task
 * @route   POST /api/listening/process-paragraph
 */
const processParagraph = async (req, res, next) => {
  try {
    const { title, paragraphText } = req.body;

    if (!title || !paragraphText) {
      res.status(400);
      throw new Error('Tiêu đề và nội dung đoạn văn là bắt buộc');
    }

    const sentenceTexts = splitParagraphIntoSentences(paragraphText);

    if (sentenceTexts.length === 0) {
      res.status(400);
      throw new Error('Không thể tách câu từ đoạn văn đã cung cấp');
    }

    const sentences = sentenceTexts.map(text => ({
      text,
      audioUrl: ''
    }));

    // Fix #5: gắn user vào task mới
    const task = await ListeningTask.create({
      user: req.user._id,
      title,
      paragraphText,
      sentences
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all listening tasks
 * @route   GET /api/listening/tasks
 */
const getAllTasks = async (req, res, next) => {
  try {
    // Fix #5: chỉ lấy tasks của user hiện tại
    const tasks = await ListeningTask.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single listening task by ID
 * @route   GET /api/listening/tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    // Fix #5: chỉ tìm task nếu thuộc về user hiện tại
    const task = await ListeningTask.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Không tìm thấy bài tập nghe');
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a listening task by ID
 * @route   DELETE /api/listening/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    // Fix #5: chỉ xóa task nếu thuộc về user hiện tại
    const task = await ListeningTask.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Không tìm thấy bài tập nghe');
    }

    await ListeningTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa bài tập nghe thành công' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processParagraph,
  getAllTasks,
  getTaskById,
  deleteTask
};
