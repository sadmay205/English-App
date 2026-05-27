const mongoose = require('mongoose');

const listeningTaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Bài tập nghe phải thuộc về một người dùng'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Tiêu đề bài tập nghe là bắt buộc'],
    trim: true,
  },
  paragraphText: {
    type: String,
    required: [true, 'Đoạn văn bản gốc là bắt buộc'],
  },
  sentences: [{
    text: {
      type: String,
      required: true,
    },
    audioUrl: {
      type: String,
      default: '',
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ListeningTask', listeningTaskSchema);
