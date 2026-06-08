const VocabSet = require('../models/VocabSet');
const Vocabulary = require('../models/Vocabulary');
const { parsePdfVocabulary } = require('../utils/pdfParser');

/**
 * @desc    Get all vocabulary sets with word count (scoped to current user)
 * @route   GET /api/vocabulary/sets
 * Fix #5: User isolation — chỉ lấy sets của user hiện tại
 * Fix #7: Dùng Aggregation để tránh N+1 queries
 */
const getAllSets = async (req, res, next) => {
  try {
    const sets = await VocabSet.aggregate([
      { $match: { user: req.user._id } },
      {
        $lookup: {
          from: 'vocabularies',
          localField: '_id',
          foreignField: 'vocabSet',
          as: 'words',
        },
      },
      { $addFields: { wordCount: { $size: '$words' } } },
      { $project: { words: 0 } },
      { $sort: { lastStudiedAt: -1 } },
    ]);

    res.json(sets);
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
      user: req.user._id, // Fix #5: gắn owner
      title,
      description: description || '',
    });

    res.status(201).json({ ...set.toObject(), wordCount: 0 });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a vocabulary set with all its words (must belong to current user)
 * @route   GET /api/vocabulary/sets/:id
 */
const getSetById = async (req, res, next) => {
  try {
    // Fix #5: thêm điều kiện user vào query
    const set = await VocabSet.findOne({ _id: req.params.id, user: req.user._id });

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
    const { vocabSetId, word, phonetic, meaningVi, exampleSentence, exampleMeaningVi, englishDefinition } = req.body;

    if (!vocabSetId || !word || !meaningVi) {
      res.status(400);
      throw new Error('Cần cung cấp vocabSetId, word và meaningVi');
    }

    // Fix #5: xác minh set tồn tại VÀ thuộc về user hiện tại
    const set = await VocabSet.findOne({ _id: vocabSetId, user: req.user._id });
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
      englishDefinition: englishDefinition || '',
    });

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

    // Fix #5: xác minh set tồn tại VÀ thuộc về user hiện tại
    const set = await VocabSet.findOne({ _id: vocabSetId, user: req.user._id });
    if (!set) {
      res.status(404);
      throw new Error('Không tìm thấy bộ từ vựng');
    }

    const { words, groups } = await parsePdfVocabulary(req.file.buffer);

    if (words.length === 0) {
      res.status(400);
      throw new Error('Không tìm thấy từ vựng trong file PDF');
    }

    const vocabDocs = words.map((w) => ({
      vocabSet: vocabSetId,
      word: w.word,
      phonetic: w.phonetic,
      meaningVi: w.meaningVi,
      englishDefinition: w.englishDefinition || '',
      exampleSentence: w.exampleSentence || '',
      exampleMeaningVi: w.exampleMeaningVi || '',
    }));

    const inserted = await Vocabulary.insertMany(vocabDocs);

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
    // Fix #5: chỉ xóa set nếu thuộc về user hiện tại
    const set = await VocabSet.findOne({ _id: req.params.id, user: req.user._id });

    if (!set) {
      res.status(404);
      throw new Error('Không tìm thấy bộ từ vựng');
    }

    await Vocabulary.deleteMany({ vocabSet: set._id });
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
    const vocab = await Vocabulary.findById(req.params.id).populate('vocabSet');

    if (!vocab) {
      res.status(404);
      throw new Error('Không tìm thấy từ vựng');
    }

    // Fix #5: xác minh từ vựng thuộc bộ từ của user hiện tại
    if (vocab.vocabSet && vocab.vocabSet.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Không có quyền xóa từ vựng này');
    }

    await Vocabulary.findByIdAndDelete(req.params.id);

    res.json({ message: 'Đã xóa từ vựng thành công' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate English definitions for vocabulary words in a set using AI
 * @route   POST /api/vocabulary/sets/:setId/generate-definitions
 */
const generateDefinitions = async (req, res, next) => {
  try {
    const { setId } = req.params;

    // Verify set exists and belongs to current user
    const set = await VocabSet.findOne({ _id: setId, user: req.user._id });
    if (!set) {
      res.status(404);
      throw new Error('Không tìm thấy bộ từ vựng');
    }

    // Find all vocabularies in the set
    const vocabularies = await Vocabulary.find({ vocabSet: setId });
    
    // Filter words missing English definitions
    const missingVocabs = vocabularies.filter((v) => !v.englishDefinition);

    if (missingVocabs.length === 0) {
      return res.json({
        message: 'Tất cả từ vựng đều đã có định nghĩa tiếng Anh!',
        count: 0,
        vocabularies,
      });
    }

    // Batch compile definitions in groups of 15 to avoid token issues and rate limits
    const { chatCompletion } = require('../config/openrouter');
    const batchSize = 15;
    const updatedVocabs = [];

    for (let i = 0; i < missingVocabs.length; i += batchSize) {
      const currentBatch = missingVocabs.slice(i, i + batchSize);
      const batchData = currentBatch.map((v) => ({
        id: v._id.toString(),
        word: v.word,
        meaningVi: v.meaningVi,
      }));

      const systemPrompt = `You are a dictionary lexicographer. Your task is to write a concise English definition for the given words.
Rules:
1. The definition must be very short and simple (1 sentence, max 15 words).
2. It should explain the meaning clearly for a Vietnamese student learning English.
3. DO NOT use the word itself in the definition.
4. Output MUST be a valid JSON array of objects, with keys "id" and "definition". Do not include markdown code block wrapper or any extra explanations.
Example output format:
[{"id": "...", "definition": "..."}]`;

      const userPrompt = `Provide definitions for this JSON list of words:\n${JSON.stringify(batchData)}`;

      try {
        const response = await chatCompletion([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ], {
          temperature: 0.3,
        });

        if (response && response.choices && response.choices[0]) {
          let textResult = response.choices[0].message.content.trim();
          
          // Remove Markdown wrappers if present
          if (textResult.startsWith('```')) {
            textResult = textResult.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
          }

          const parsedDefinitions = JSON.parse(textResult);

          if (Array.isArray(parsedDefinitions)) {
            for (const item of parsedDefinitions) {
              const vocab = await Vocabulary.findOneAndUpdate(
                { _id: item.id, vocabSet: setId },
                { englishDefinition: item.definition.trim() },
                { new: true }
              );
              if (vocab) {
                updatedVocabs.push(vocab);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error generating batch of definitions:', err);
        // Continue to other batches or return what we completed
      }
    }

    // Retrieve final list of vocabularies
    const finalVocabularies = await Vocabulary.find({ vocabSet: setId });

    res.json({
      message: `Đã tự động tạo định nghĩa tiếng Anh cho ${updatedVocabs.length} từ vựng!`,
      count: updatedVocabs.length,
      vocabularies: finalVocabularies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a vocabulary word details
 * @route   PUT /api/vocabulary/item/:id
 */
const updateVocabulary = async (req, res, next) => {
  try {
    const { word, phonetic, meaningVi, exampleSentence, exampleMeaningVi, englishDefinition } = req.body;

    const vocab = await Vocabulary.findById(req.params.id).populate('vocabSet');

    if (!vocab) {
      res.status(404);
      throw new Error('Không tìm thấy từ vựng');
    }

    // Verify user owns the set
    if (vocab.vocabSet && vocab.vocabSet.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Không có quyền chỉnh sửa từ vựng này');
    }

    // Update fields
    if (word !== undefined) vocab.word = word;
    if (phonetic !== undefined) vocab.phonetic = phonetic;
    if (meaningVi !== undefined) vocab.meaningVi = meaningVi;
    if (exampleSentence !== undefined) vocab.exampleSentence = exampleSentence;
    if (exampleMeaningVi !== undefined) vocab.exampleMeaningVi = exampleMeaningVi;
    if (englishDefinition !== undefined) vocab.englishDefinition = englishDefinition;

    const updated = await vocab.save();

    res.json(updated);
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
  generateDefinitions,
  updateVocabulary,
};
