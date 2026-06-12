const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware'); // Fix #4
const {
  getAllSets,
  createSet,
  getSetById,
  addVocabulary,
  uploadPdf,
  deleteSet,
  deleteVocabulary,
  generateDefinitions,
  updateVocabulary,
  mergeSets,
  splitSet,
  updateSet,
} = require('../controllers/vocabController');

// Configure multer for PDF upload (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF'), false);
    }
  },
});

// Fix #4: Tất cả routes yêu cầu đăng nhập
router.use(protect);

// GET /api/vocabulary/sets — Get all vocabulary sets
router.get('/sets', getAllSets);

// POST /api/vocabulary/sets — Create a new vocabulary set
router.post('/sets', createSet);

// GET /api/vocabulary/sets/:id — Get a set with its vocabularies
router.get('/sets/:id', getSetById);

// POST /api/vocabulary/sets/:setId/generate-definitions — Generate definitions using AI
router.post('/sets/:setId/generate-definitions', generateDefinitions);

// POST /api/vocabulary/item — Add a single vocabulary to a set
router.post('/item', addVocabulary);

// POST /api/vocabulary/upload-pdf — Upload PDF and parse vocabularies
router.post('/upload-pdf', upload.single('pdf'), uploadPdf);

// DELETE /api/vocabulary/sets/:id — Delete a vocabulary set
router.delete('/sets/:id', deleteSet);

// PUT /api/vocabulary/sets/:id — Update a vocabulary set
router.put('/sets/:id', updateSet);

// DELETE /api/vocabulary/item/:id — Delete a single vocabulary word
router.delete('/item/:id', deleteVocabulary);

// PUT /api/vocabulary/item/:id — Update a single vocabulary word
router.put('/item/:id', updateVocabulary);

// POST /api/vocabulary/merge — Merge two vocabulary sets
router.post('/merge', mergeSets);

// POST /api/vocabulary/split — Split selected words from a set into a new set
router.post('/split', splitSet);

module.exports = router;
