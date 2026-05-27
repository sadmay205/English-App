const VocabSet = require('../models/VocabSet');
const Vocabulary = require('../models/Vocabulary');
const { parsePdfVocabulary } = require('../utils/pdfParser');

/**
 * @desc    Get all vocabulary sets with word count
 * @route   GET /api/vocabulary/sets
 */
const getAllSets = async (req, res, next) => {
  try {
    const sets = await VocabSet.find().sort({ lastStudiedAt: -1 });

    // Attach word count to each set
    const setsWithCount = await Promise.all(
      sets.map(async (set) => {
        const count = await Vocabulary.countDocuments({ vocabSet: set._id });
        return { ...set.toObject(), wordCount: count };
      })
    );

    res.json(setsWithCount);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new vocabulary set
 * @route   POST /api/vocabulary/sets
 */
const createSet = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('Tên bộ từ vựng là bắt buộc');
    }

    const set = await VocabSet.create({
      title,
      description: description || '',
    });

    res.status(201).json(set);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a vocabulary set with all its words
 * @route   GET /api/vocabulary/sets/:id
 */
const getSetById = async (req, res, next) => {
  try {
    const set = await VocabSet.findById(req.params.id);

    if (!set) {
      res.status(404);
      throw new Error('Không tìm thấy bộ từ vựng');
    }

    const vocabularies = await Vocabulary.find({ vocabSet: set._id });

    res.json({
      ...set.toObject(),
      wordCount: vocabularies.length,
      vocabularies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a single vocabulary word to a set
 * @route   POST /api/vocabulary/item
 */
const addVocabulary = async (req, res, next) => {
  try {
    const { vocabSetId, word, phonetic, meaningVi, exampleSentence, exampleMeaningVi } = req.body;

    if (!vocabSetId || !word || !meaningVi) {
      res.status(400);
      throw new Error('Cần cung cấp vocabSetId, word và meaningVi');
    }

    // Verify set exists
    const set = await VocabSet.findById(vocabSetId);
    if (!set) {
      res.status(404);
      throw new Error('Không tìm thấy bộ từ vựng');
    }

    const vocab = await Vocabulary.create({
      vocabSet: vocabSetId,
      word,
      phonetic: phonetic || '',
      meaningVi,
      exampleSentence: exampleSentence || '',
      exampleMeaningVi: exampleMeaningVi || '',
    });

    // Update lastStudiedAt
    set.lastStudiedAt = new Date();
    await set.save();

    res.status(201).json(vocab);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload PDF and parse vocabularies into a set
 * @route   POST /api/vocabulary/upload-pdf
 */
const uploadPdf = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Vui lòng tải lên file PDF');
    }

    const { vocabSetId } = req.body;

    if (!vocabSetId) {
      res.status(400);
      throw new Error('Cần cung cấp vocabSetId');
    }

    // Verify set exists
    const set = await VocabSet.findById(vocabSetId);
    if (!set) {
      res.status(404);
      throw new Error('Không tìm thấy bộ từ vựng');
    }

    // Parse PDF
    const { words, groups } = await parsePdfVocabulary(req.file.buffer);

    if (words.length === 0) {
      res.status(400);
      throw new Error('Không tìm thấy từ vựng trong file PDF');
    }

    // Bulk insert vocabularies
    const vocabDocs = words.map((w) => ({
      vocabSet: vocabSetId,
      word: w.word,
      phonetic: w.phonetic,
      meaningVi: w.meaningVi,
    }));

    const inserted = await Vocabulary.insertMany(vocabDocs);

    // Update set
    set.lastStudiedAt = new Date();
    if (!set.description && groups.length > 0) {
      set.description = `Chủ đề: ${groups.join(', ')}`;
    }
    await set.save();

    res.status(201).json({
      message: `Đã import ${inserted.length} từ vựng từ PDF`,
      count: inserted.length,
      groups,
      vocabularies: inserted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a vocabulary set and all its words
 * @route   DELETE /api/vocabulary/sets/:id
 */
const deleteSet = async (req, res, next) => {
  try {
    const set = await VocabSet.findById(req.params.id);

    if (!set) {
      res.status(404);
      throw new Error('Không tìm thấy bộ từ vựng');
    }

    // Delete all vocabularies in this set
    await Vocabulary.deleteMany({ vocabSet: set._id });

    // Delete the set itself
    await VocabSet.findByIdAndDelete(set._id);

    res.json({ message: 'Đã xóa bộ từ vựng' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a single vocabulary word
 * @route   DELETE /api/vocabulary/item/:id
 */
const deleteVocabulary = async (req, res, next) => {
  try {
    const vocab = await Vocabulary.findById(req.params.id);

    if (!vocab) {
      res.status(404);
      throw new Error('Không tìm thấy từ vựng');
    }

    await Vocabulary.findByIdAndDelete(req.params.id);

    res.json({ message: 'Đã xóa từ vựng thành công' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSets,
  createSet,
  getSetById,
  addVocabulary,
  uploadPdf,
  deleteSet,
  deleteVocabulary,
};

