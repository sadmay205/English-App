const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
  vocabSet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VocabSet',
    required: true,
  },
  word: {
    type: String,
    required: [true, 'Từ vựng là bắt buộc'],
    trim: true,
  },
  phonetic: {
    type: String,
    default: '',
  },
  meaningVi: {
    type: String,
    required: [true, 'Nghĩa tiếng Việt là bắt buộc'],
  },
  exampleSentence: {
    type: String,
    default: '',
  },
  exampleMeaningVi: {
    type: String,
    default: '',
  },
  englishDefinition: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('Vocabulary', vocabularySchema);
