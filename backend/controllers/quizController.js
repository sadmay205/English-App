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
    const selectedVocabs = shuffle(allVocabs).slice(0, numQuestions);

    let questions = [];

    if (type === 'multiple-choice-vie') {
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
          type: 'multiple-choice-vie',
          question: vocab.word,
          phonetic: vocab.phonetic || '',
          options,
          correctIndex,
          correctAnswer: vocab.meaningVi,
        };
      });
    } else if (type === 'multiple-choice-en') {
      const vocabsWithEn = allVocabs.filter(
        (v) => v.englishDefinition && v.englishDefinition.trim() !== ''
      );

      if (vocabsWithEn.length < 4) {
        res.status(400);
        throw new Error(
          'Bộ từ vựng cần ít nhất 4 từ có định nghĩa tiếng Anh để tạo bài kiểm tra trắc nghiệm tiếng Anh. Hãy dùng tính năng "Tự động dịch nghĩa AI" ở trang Học từ vựng trước.'
        );
      }

      const numQuestions = Math.min(parseInt(count), vocabsWithEn.length);
      const selectedVocabs = shuffle(vocabsWithEn).slice(0, numQuestions);

      questions = selectedVocabs.map((vocab) => {
        // Get 3 wrong answers from other vocabs' English definitions
        const wrongOptions = shuffle(
          vocabsWithEn.filter((v) => v._id.toString() !== vocab._id.toString())
        )
          .slice(0, 3)
          .map((v) => v.englishDefinition);

        // Create options array with correct answer
        const options = shuffle([...wrongOptions, vocab.englishDefinition]);
        const correctIndex = options.indexOf(vocab.englishDefinition);

        return {
          id: vocab._id,
          type: 'multiple-choice-en',
          question: vocab.word,
          phonetic: vocab.phonetic || '',
          options,
          correctIndex,
          correctAnswer: vocab.englishDefinition,
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
    } else if (type === 'fill-blank-en') {
      const vocabsWithEn = allVocabs.filter(
        (v) => v.englishDefinition && v.englishDefinition.trim() !== ''
      );

      if (vocabsWithEn.length < 4) {
        res.status(400);
        throw new Error(
          'Bộ từ vựng cần ít nhất 4 từ có định nghĩa tiếng Anh để tạo bài kiểm tra điền từ định nghĩa. Hãy dùng tính năng "Tự động dịch nghĩa AI" ở trang Học từ vựng trước.'
        );
      }

      const numQuestions = Math.min(parseInt(count), vocabsWithEn.length);
      const selectedVocabsForEn = shuffle(vocabsWithEn).slice(0, numQuestions);

      questions = selectedVocabsForEn.map((vocab) => {
        const word = vocab.word;
        let hint = '';
        if (word.length <= 3) {
          hint = word[0] + '_'.repeat(word.length - 1);
        } else {
          hint = word[0] + '_'.repeat(word.length - 2) + word[word.length - 1];
        }

        return {
          id: vocab._id,
          type: 'fill-blank-en',
          hint,
          englishDefinition: vocab.englishDefinition,
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
    } else if (type === 'matching-en') {
      const vocabsWithEn = allVocabs.filter(
        (v) => v.englishDefinition && v.englishDefinition.trim() !== ''
      );

      if (vocabsWithEn.length < 4) {
        res.status(400);
        throw new Error(
          'Bộ từ vựng cần ít nhất 4 từ có định nghĩa tiếng Anh để tạo bài kiểm tra ghép từ định nghĩa. Hãy dùng tính năng "Tự động dịch nghĩa AI" ở trang Học từ vựng trước.'
        );
      }

      const numQuestions = Math.min(parseInt(count), vocabsWithEn.length);
      const selectedVocabsForEn = shuffle(vocabsWithEn).slice(0, numQuestions);

      questions = selectedVocabsForEn.map((vocab) => ({
        id: vocab._id,
        type: 'matching-en',
        word: vocab.word,
        englishDefinition: vocab.englishDefinition,
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

    // Helper to shuffle
    const shuffleArray = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    // We process each requested type in typesConfig
    for (const [type, countVal] of Object.entries(typesConfig)) {
      const count = parseInt(countVal) || 0;
      if (count <= 0) continue;

      if (type === 'multiple-choice-vie') {
        if (allVocabs.length < 4) {
          res.status(400);
          throw new Error('Cần ít nhất 4 từ trong bộ từ để tạo câu hỏi trắc nghiệm tiếng Việt');
        }
        // Choose vocab words from the pool
        const selected = shuffleArray(poolVocabs).slice(0, Math.min(count, poolVocabs.length));
        selected.forEach((vocab) => {
          // Get 3 wrong options from the *all* vocabs list
          const wrongOptions = shuffleArray(
            allVocabs.filter((v) => v._id.toString() !== vocab._id.toString())
          )
            .slice(0, 3)
            .map((v) => v.meaningVi);

          const options = shuffleArray([...wrongOptions, vocab.meaningVi]);
          const correctIndex = options.indexOf(vocab.meaningVi);

          questions.push({
            id: vocab._id,
            type: 'multiple-choice-vie',
            question: vocab.word,
            phonetic: vocab.phonetic || '',
            options,
            correctIndex,
            correctAnswer: vocab.meaningVi,
          });
        });
      } else if (type === 'multiple-choice-en') {
        const allVocabsWithEn = allVocabs.filter(
          (v) => v.englishDefinition && v.englishDefinition.trim() !== ''
        );
        const poolVocabsWithEn = poolVocabs.filter(
          (v) => v.englishDefinition && v.englishDefinition.trim() !== ''
        );

        if (allVocabsWithEn.length < 4) {
          res.status(400);
          throw new Error('Cần ít nhất 4 từ có định nghĩa tiếng Anh để tạo trắc nghiệm định nghĩa Anh');
        }

        const selected = shuffleArray(poolVocabsWithEn).slice(0, Math.min(count, poolVocabsWithEn.length));
        selected.forEach((vocab) => {
          const wrongOptions = shuffleArray(
            allVocabsWithEn.filter((v) => v._id.toString() !== vocab._id.toString())
          )
            .slice(0, 3)
            .map((v) => v.englishDefinition);

          const options = shuffleArray([...wrongOptions, vocab.englishDefinition]);
          const correctIndex = options.indexOf(vocab.englishDefinition);

          questions.push({
            id: vocab._id,
            type: 'multiple-choice-en',
            question: vocab.word,
            phonetic: vocab.phonetic || '',
            options,
            correctIndex,
            correctAnswer: vocab.englishDefinition,
          });
        });
      } else if (type === 'fill-blank') {
        const selected = shuffleArray(poolVocabs).slice(0, Math.min(count, poolVocabs.length));
        selected.forEach((vocab) => {
          const word = vocab.word;
          let hint = '';
          if (word.length <= 3) {
            hint = word[0] + '_'.repeat(word.length - 1);
          } else {
            hint = word[0] + '_'.repeat(word.length - 2) + word[word.length - 1];
          }

          questions.push({
            id: vocab._id,
            type: 'fill-blank',
            hint,
            meaningVi: vocab.meaningVi,
            phonetic: vocab.phonetic || '',
            correctAnswer: vocab.word,
            wordLength: word.length,
          });
        });
      } else if (type === 'fill-blank-en') {
        const poolVocabsWithEn = poolVocabs.filter(
          (v) => v.englishDefinition && v.englishDefinition.trim() !== ''
        );

        if (poolVocabsWithEn.length === 0) {
          res.status(400);
          throw new Error('Không có từ vựng nào có định nghĩa tiếng Anh trong nhóm từ được chọn');
        }

        const selected = shuffleArray(poolVocabsWithEn).slice(0, Math.min(count, poolVocabsWithEn.length));
        selected.forEach((vocab) => {
          const word = vocab.word;
          let hint = '';
          if (word.length <= 3) {
            hint = word[0] + '_'.repeat(word.length - 1);
          } else {
            hint = word[0] + '_'.repeat(word.length - 2) + word[word.length - 1];
          }

          questions.push({
            id: vocab._id,
            type: 'fill-blank-en',
            hint,
            englishDefinition: vocab.englishDefinition,
            phonetic: vocab.phonetic || '',
            correctAnswer: vocab.word,
            wordLength: word.length,
          });
        });
      } else if (type === 'matching') {
        const selected = shuffleArray(poolVocabs).slice(0, Math.min(count, poolVocabs.length));
        selected.forEach((vocab) => {
          questions.push({
            id: vocab._id,
            type: 'matching',
            word: vocab.word,
            meaningVi: vocab.meaningVi,
            phonetic: vocab.phonetic || '',
          });
        });
      } else if (type === 'matching-en') {
        const poolVocabsWithEn = poolVocabs.filter(
          (v) => v.englishDefinition && v.englishDefinition.trim() !== ''
        );

        if (poolVocabsWithEn.length === 0) {
          res.status(400);
          throw new Error('Không có từ vựng nào có định nghĩa tiếng Anh trong nhóm từ được chọn');
        }

        const selected = shuffleArray(poolVocabsWithEn).slice(0, Math.min(count, poolVocabsWithEn.length));
        selected.forEach((vocab) => {
          questions.push({
            id: vocab._id,
            type: 'matching-en',
            word: vocab.word,
            englishDefinition: vocab.englishDefinition,
            phonetic: vocab.phonetic || '',
          });
        });
      }
    }

    if (questions.length === 0) {
      res.status(400);
      throw new Error('Không thể tạo câu hỏi nào. Hãy chắc chắn bạn đã nhập số câu và chọn từ vựng hợp lệ.');
    }

    // Shuffle the final list of questions
    questions = shuffleArray(questions);

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
