const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // optional để tương thích dữ liệu cũ
    index: true,
  },
  vocabSetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VocabSet',
    required: false,
  },
  listeningTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ListeningTask',
    required: false,
  },
  quizType: {
    type: String,
    enum: ['multiple-choice', 'fill-blank', 'matching', 'smart-study', 'listening-complete', 'listening-quiz'],
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Progress', progressSchema);
