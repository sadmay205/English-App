const mongoose = require('mongoose');

const vocabSetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bộ từ vựng phải thuộc về một người dùng'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Tên bộ từ vựng là bắt buộc'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  lastStudiedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('VocabSet', vocabSetSchema);
