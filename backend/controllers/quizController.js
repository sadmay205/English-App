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

// ===== Shared Quiz Generation Helpers =====

/**
 * Generate a hint string by masking middle characters of a word
 * e.g. "hello" -> "h___o", "cat" -> "c__"
 */
const generateHint = (word) => {
  if (word.length <= 3) {
    return word[0] + '_'.repeat(word.length - 1);
  }
  return word[0] + '_'.repeat(word.length - 2) + word[word.length - 1];
};

/**
 * Generate multiple-choice questions (Vietnamese or English definitions)
 * @param {Array} selectedVocabs - Vocabs to create questions from
 * @param {Array} allOptionsPool - Full pool for generating wrong answers
 * @param {'vie'|'en'} lang - 'vie' for meaningVi, 'en' for englishDefinition
 */
const makeMCQuestions = (selectedVocabs, allOptionsPool, lang) => {
  const isEn = lang === 'en';
  const getAnswer = (v) => isEn ? v.englishDefinition : v.meaningVi;
  const quizType = isEn ? 'multiple-choice-en' : 'multiple-choice-vie';

  return selectedVocabs.map((vocab) => {
    const correctAnswer = getAnswer(vocab);
    const wrongOptions = shuffle(
      allOptionsPool.filter((v) => v._id.toString() !== vocab._id.toString())
    )
      .slice(0, 3)
      .map(getAnswer);

    const options = shuffle([...wrongOptions, correctAnswer]);
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: vocab._id,
      type: quizType,
      question: vocab.word,
      phonetic: vocab.phonetic || '',
      options,
      correctIndex,
      correctAnswer,
    };
  });
};

/**
 * Generate fill-in-the-blank questions
 * @param {Array} selectedVocabs - Vocabs to create questions from
 * @param {'vie'|'en'} lang - 'vie' for meaningVi hint, 'en' for englishDefinition hint
 */
const makeFillBlankQuestions = (selectedVocabs, lang) => {
  const isEn = lang === 'en';
  const quizType = isEn ? 'fill-blank-en' : 'fill-blank';

  return selectedVocabs.map((vocab) => {
    const hint = generateHint(vocab.word);
    const base = {
      id: vocab._id,
      type: quizType,
      hint,
      phonetic: vocab.phonetic || '',
      correctAnswer: vocab.word,
      wordLength: vocab.word.length,
    };

    if (isEn) {
      base.englishDefinition = vocab.englishDefinition;
    } else {
      base.meaningVi = vocab.meaningVi;
    }

    return base;
  });
};

/**
 * Generate matching questions
 * @param {Array} selectedVocabs - Vocabs to create questions from
 * @param {'vie'|'en'} lang - 'vie' for meaningVi, 'en' for englishDefinition
 */
const makeMatchingQuestions = (selectedVocabs, lang) => {
  const isEn = lang === 'en';
  const quizType = isEn ? 'matching-en' : 'matching';

  return selectedVocabs.map((vocab) => {
    const base = {
      id: vocab._id,
      type: quizType,
      word: vocab.word,
      phonetic: vocab.phonetic || '',
    };

    if (isEn) {
      base.englishDefinition = vocab.englishDefinition;
    } else {
      base.meaningVi = vocab.meaningVi;
    }

    return base;
  });
};

/**
 * Filter vocabs that have English definitions
 */
const filterWithEnglishDef = (vocabs) =>
  vocabs.filter((v) => v.englishDefinition && v.englishDefinition.trim() !== '');

/**
 * Validate minimum vocab count and throw descriptive error
 */
const assertMinVocabs = (vocabs, min, res, featureName) => {
  if (vocabs.length < min) {
    res.status(400);
    throw new Error(
      `Cần ít nhất ${min} từ${featureName ? ` có ${featureName}` : ''} để tạo bài kiểm tra. Hãy dùng tính năng "Tự động dịch nghĩa AI" ở trang Học từ vựng trước.`
    );
  }
};

// ===== Controller Endpoints =====

/**
 * @desc    Generate quiz questions from a vocabulary set
 * @route   GET /api/quiz/generate/:setId?type=multiple-choice-vie|multiple-choice-en|fill-blank&count=10
 */
const generateQuiz = async (req, res, next) => {
  try {
    const { setId } = req.params;
    const { type = 'multiple-choice-vie', count = 10 } = req.query;

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
    let questions = [];

    if (type === 'multiple-choice-vie') {
      const selected = shuffle(allVocabs).slice(0, numQuestions);
      questions = makeMCQuestions(selected, allVocabs, 'vie');

    } else if (type === 'multiple-choice-en') {
      const vocabsWithEn = filterWithEnglishDef(allVocabs);
      assertMinVocabs(vocabsWithEn, 4, res, 'định nghĩa tiếng Anh');
      const selected = shuffle(vocabsWithEn).slice(0, Math.min(numQuestions, vocabsWithEn.length));
      questions = makeMCQuestions(selected, vocabsWithEn, 'en');

    } else if (type === 'fill-blank') {
      const selected = shuffle(allVocabs).slice(0, numQuestions);
      questions = makeFillBlankQuestions(selected, 'vie');

    } else if (type === 'fill-blank-en') {
      const vocabsWithEn = filterWithEnglishDef(allVocabs);
      assertMinVocabs(vocabsWithEn, 4, res, 'định nghĩa tiếng Anh');
      const selected = shuffle(vocabsWithEn).slice(0, Math.min(numQuestions, vocabsWithEn.length));
      questions = makeFillBlankQuestions(selected, 'en');

    } else if (type === 'matching') {
      const selected = shuffle(allVocabs).slice(0, numQuestions);
      questions = makeMatchingQuestions(selected, 'vie');

    } else if (type === 'matching-en') {
      const vocabsWithEn = filterWithEnglishDef(allVocabs);
      assertMinVocabs(vocabsWithEn, 4, res, 'định nghĩa tiếng Anh');
      const selected = shuffle(vocabsWithEn).slice(0, Math.min(numQuestions, vocabsWithEn.length));
      questions = makeMatchingQuestions(selected, 'en');
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

/**
 * @desc    Generate a custom quiz with mixed types and custom configurations
 * @route   POST /api/quiz/generate-custom
 */
const generateCustomQuiz = async (req, res, next) => {
  try {
    const { setId, wordIds, typesConfig, timeLimit } = req.body;

    if (!setId || !typesConfig) {
      res.status(400);
      throw new Error('Thiếu thông tin setId hoặc cấu hình câu hỏi');
    }

    const set = await VocabSet.findOne({ _id: setId, user: req.user._id });
    if (!set) {
      res.status(404);
      throw new Error('Không tìm thấy bộ từ vựng hoặc bạn không có quyền truy cập');
    }

    const allVocabs = await Vocabulary.find({ vocabSet: setId });
    if (allVocabs.length === 0) {
      res.status(400);
      throw new Error('Bộ từ vựng không có từ nào');
    }

    // Filter by wordIds if provided and not empty
    let poolVocabs = allVocabs;
    if (Array.isArray(wordIds) && wordIds.length > 0) {
      poolVocabs = allVocabs.filter((v) => wordIds.includes(v._id.toString()));
      if (poolVocabs.length === 0) {
        res.status(400);
        throw new Error('Không tìm thấy từ vựng hợp lệ nào trong số các từ được chọn');
      }
    }

    let questions = [];

    // We process each requested type in typesConfig
    for (const [type, countVal] of Object.entries(typesConfig)) {
      const count = parseInt(countVal) || 0;
      if (count <= 0) continue;

      if (type === 'multiple-choice-vie') {
        assertMinVocabs(allVocabs, 4, res, '');
        const selected = shuffle(poolVocabs).slice(0, Math.min(count, poolVocabs.length));
        questions.push(...makeMCQuestions(selected, allVocabs, 'vie'));

      } else if (type === 'multiple-choice-en') {
        const allVocabsWithEn = filterWithEnglishDef(allVocabs);
        const poolVocabsWithEn = filterWithEnglishDef(poolVocabs);
        assertMinVocabs(allVocabsWithEn, 4, res, 'định nghĩa tiếng Anh');
        const selected = shuffle(poolVocabsWithEn).slice(0, Math.min(count, poolVocabsWithEn.length));
        questions.push(...makeMCQuestions(selected, allVocabsWithEn, 'en'));

      } else if (type === 'fill-blank') {
        const selected = shuffle(poolVocabs).slice(0, Math.min(count, poolVocabs.length));
        questions.push(...makeFillBlankQuestions(selected, 'vie'));

      } else if (type === 'fill-blank-en') {
        const poolVocabsWithEn = filterWithEnglishDef(poolVocabs);
        if (poolVocabsWithEn.length === 0) {
          res.status(400);
          throw new Error('Không có từ vựng nào có định nghĩa tiếng Anh trong nhóm từ được chọn');
        }
        const selected = shuffle(poolVocabsWithEn).slice(0, Math.min(count, poolVocabsWithEn.length));
        questions.push(...makeFillBlankQuestions(selected, 'en'));

      } else if (type === 'matching') {
        const selected = shuffle(poolVocabs).slice(0, Math.min(count, poolVocabs.length));
        questions.push(...makeMatchingQuestions(selected, 'vie'));

      } else if (type === 'matching-en') {
        const poolVocabsWithEn = filterWithEnglishDef(poolVocabs);
        if (poolVocabsWithEn.length === 0) {
          res.status(400);
          throw new Error('Không có từ vựng nào có định nghĩa tiếng Anh trong nhóm từ được chọn');
        }
        const selected = shuffle(poolVocabsWithEn).slice(0, Math.min(count, poolVocabsWithEn.length));
        questions.push(...makeMatchingQuestions(selected, 'en'));
      }
    }

    if (questions.length === 0) {
      res.status(400);
      throw new Error('Không thể tạo câu hỏi nào. Hãy chắc chắn bạn đã nhập số câu và chọn từ vựng hợp lệ.');
    }

    // Shuffle the final list of questions
    questions = shuffle(questions);

    res.json({
      setId,
      setTitle: set.title,
      type: 'custom',
      totalQuestions: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateQuiz, submitQuiz, getProgress, generateCustomQuiz };
