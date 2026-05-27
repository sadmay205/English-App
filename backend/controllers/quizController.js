const Vocabulary = require('../models/Vocabulary');
const VocabSet = require('../models/VocabSet');
const Progress = require('../models/Progress');

/**
 * Shuffle an array (Fisher-Yates)
 */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * @desc    Generate quiz questions from a vocabulary set
 * @route   GET /api/quiz/generate/:setId?type=multiple-choice|fill-blank&count=10
 */
const generateQuiz = async (req, res, next) => {
  try {
    const { setId } = req.params;
    const { type = 'multiple-choice', count = 10 } = req.query;

    // Fix #5: xác minh set tồn tại VÀ thuộc về user hiện tại
    const set = await VocabSet.findOne({ _id: setId, user: req.user._id });
    if (!set) {
      res.status(404);
      throw new Error('Không tìm thấy bộ từ vựng');
    }

    // Get all vocabularies in this set
    const allVocabs = await Vocabulary.find({ vocabSet: setId });

    if (allVocabs.length < 4) {
      res.status(400);
      throw new Error('Bộ từ vựng cần ít nhất 4 từ để tạo quiz');
    }

    const numQuestions = Math.min(parseInt(count), allVocabs.length);
    const selectedVocabs = shuffle(allVocabs).slice(0, numQuestions);

    let questions = [];

    if (type === 'multiple-choice') {
      questions = selectedVocabs.map((vocab) => {
        // Get 3 wrong answers from other vocabs
        const wrongOptions = shuffle(
          allVocabs.filter((v) => v._id.toString() !== vocab._id.toString())
        )
          .slice(0, 3)
          .map((v) => v.meaningVi);

        // Create options array with correct answer
        const options = shuffle([...wrongOptions, vocab.meaningVi]);
        const correctIndex = options.indexOf(vocab.meaningVi);

        return {
          id: vocab._id,
          type: 'multiple-choice',
          question: vocab.word,
          phonetic: vocab.phonetic || '',
          options,
          correctIndex,
          correctAnswer: vocab.meaningVi,
        };
      });
    } else if (type === 'fill-blank') {
      questions = selectedVocabs.map((vocab) => {
        // Create a hint by masking some characters
        const word = vocab.word;
        let hint = '';
        if (word.length <= 3) {
          hint = word[0] + '_'.repeat(word.length - 1);
        } else {
          // Show first letter and last letter, mask the rest
          hint = word[0] + '_'.repeat(word.length - 2) + word[word.length - 1];
        }

        return {
          id: vocab._id,
          type: 'fill-blank',
          hint,
          meaningVi: vocab.meaningVi,
          phonetic: vocab.phonetic || '',
          correctAnswer: vocab.word,
          wordLength: word.length,
        };
      });
    } else if (type === 'matching') {
      questions = selectedVocabs.map((vocab) => ({
        id: vocab._id,
        type: 'matching',
        word: vocab.word,
        meaningVi: vocab.meaningVi,
        phonetic: vocab.phonetic || '',
      }));
    }


    res.json({
      setId,
      setTitle: set.title,
      type,
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit quiz results and save progress
 * @route   POST /api/quiz/submit
 */
const submitQuiz = async (req, res, next) => {
  try {
    const { vocabSetId, listeningTaskId, quizType, score, totalQuestions } = req.body;

    if ((!vocabSetId && !listeningTaskId) || !quizType || score === undefined || !totalQuestions) {
      res.status(400);
      throw new Error('Thiếu thông tin cần thiết (vocabSetId hoặc listeningTaskId, quizType, score, totalQuestions)');
    }

    // Fix #5: lưu user vào progress record
    const progress = await Progress.create({
      user: req.user._id,
      vocabSetId: vocabSetId || null,
      listeningTaskId: listeningTaskId || null,
      quizType,
      score,
      totalQuestions,
    });

    // Update lastStudiedAt on the vocab set if it was a vocab quiz
    if (vocabSetId) {
      await VocabSet.findOneAndUpdate(
        { _id: vocabSetId, user: req.user._id },
        { lastStudiedAt: new Date() }
      );
    }

    res.status(201).json({
      message: 'Đã lưu kết quả',
      progress,
      percentage: Math.round((score / totalQuestions) * 100),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get quiz progress history
 * @route   GET /api/quiz/progress?setId=xxx&taskId=yyy
 */
const getProgress = async (req, res, next) => {
  try {
    const { setId, taskId } = req.query;
    // Fix #5: chỉ lấy progress của user hiện tại
    const filter = { user: req.user._id };
    if (setId) filter.vocabSetId = setId;
    if (taskId) filter.listeningTaskId = taskId;

    const progress = await Progress.find(filter)
      .sort({ completedAt: -1 })
      .limit(50)
      .populate('vocabSetId', 'title')
      .populate('listeningTaskId', 'title');

    res.json(progress);
  } catch (error) {
    next(error);
  }
};

module.exports = { generateQuiz, submitQuiz, getProgress };
