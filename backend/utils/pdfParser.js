const pdf = require('pdf-parse');

const containsVietnamese = (str) => {
  return /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(str);
};

const isNoiseLine = (line) => {
  const normalized = line.toLowerCase();
  return (
    normalized.includes('anhle') ||
    normalized.includes('http') ||
    normalized.includes('facebook') ||
    normalized.includes('hotline') ||
    normalized.includes('096 740 36 48') ||
    normalized.includes('giới thiệu') ||
    normalized.includes('biên soạn') ||
    normalized.includes('giảng viên') ||
    normalized.includes('tài liệu') ||
    normalized.includes('chinh phục') ||
    normalized.includes('thắc mắc') ||
    normalized.includes('liên hệ') ||
    normalized.includes('group') ||
    normalized.includes('website') ||
    normalized.includes('trung tâm') ||
    normalized.includes('đồng hỗ trợ') ||
    normalized.includes('toeic sharing') ||
    normalized.includes('anh talk') ||
    normalized.includes('tiếng anh giao tiếp') ||
    normalized.includes('luyện thi') ||
    normalized.includes('quyển sách') ||
    normalized.includes('hữu ích') ||
    normalized.includes('cộng đồng') ||
    normalized.includes('bản đồ') ||
    normalized.match(/^thi\.$/) ||
    normalized.match(/^page \d+$/)
  );
};

/**
 * Parse a PDF buffer and extract vocabulary entries.
 * Supports:
 * 1. Standard format: "* Word /phonetic/ (pos): Meaning"
 * 2. Unstructured format: Lowercase word lines + "+" definition + English examples
 * 3. Slash format: "Word /phonetic/ Meaning"
 * 
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @returns {Promise<{words: Array, groups: Array}>}
 */
const parsePdfVocabulary = async (pdfBuffer) => {
  const data = await pdf(pdfBuffer);
  const text = data.text;

  // Split text into lines, trim, and filter out empty lines
  const rawLines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // Check if document has asterisk entries
  const hasAsterisks = rawLines.some((line) => line.startsWith('*'));

  // Check if document has slash entries (e.g. word /phonetic/ meaning)
  const slashPattern = /^([^\/]+?)\s*\/([^\/]+)\/\s*(.+)$/;
  const slashLinesCount = rawLines.filter(line => slashPattern.test(line)).length;
  const hasSlashFormat = slashLinesCount >= 3;

  // Check if document has table-wrapped entries (with phonetic starting on its own line)
  const hasTableFormat = rawLines.some((line) => line.startsWith('/') && !line.match(/^\d+\.\s*(.+)$/));

  if (hasAsterisks) {
    // ---------------- Standard Asterisk Parser ----------------
    const words = [];
    const groups = [];
    let currentGroup = '';
    let currentEntry = null;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];

      // Skip page headers
      if (line.match(/^ULTIMATE VOCABULARY.*Page \d+$/)) {
        continue;
      }

      // Detect group headers (e.g., "NHÓM 1: TÀI CHÍNH...")
      const groupMatch = line.match(/^NHÓM\s+\d+:\s*(.+)$/i);
      if (groupMatch) {
        currentGroup = groupMatch[1].trim();
        if (!groups.includes(currentGroup)) {
          groups.push(currentGroup);
        }
        continue;
      }

      // Detect vocabulary entries starting with "* "
      const entryMatch = line.match(/^\*\s+(.+)$/);
      if (entryMatch) {
        if (currentEntry) {
          words.push(currentEntry);
        }

        const entryText = entryMatch[1];

        // Format with phonetic: "Word /phonetic/ (pos): Meaning"
        const phoneticMatch = entryText.match(/^(.+?)\s+\/([^/]+)\/\s*(?:\([^)]*\))?\s*:\s*(.+)$/);
        if (phoneticMatch) {
          currentEntry = {
            word: phoneticMatch[1].trim(),
            phonetic: `/${phoneticMatch[2].trim()}/`,
            meaningVi: phoneticMatch[3].trim(),
            group: currentGroup,
          };
          continue;
        }

        // Format without phonetic: "Word / Phrase: Meaning"
        const simpleMatch = entryText.match(/^(.+?):\s*(.+)$/);
        if (simpleMatch) {
          currentEntry = {
            word: simpleMatch[1].trim(),
            phonetic: '',
            meaningVi: simpleMatch[2].trim(),
            group: currentGroup,
          };
          continue;
        }

        // Fallback
        currentEntry = {
          word: entryText,
          phonetic: '',
          meaningVi: '',
          group: currentGroup,
        };
      } else if (currentEntry && !line.startsWith('NHÓM')) {
        currentEntry.meaningVi += ' ' + line;
      }
    }

    if (currentEntry) {
      words.push(currentEntry);
    }

    words.forEach((w) => {
      w.meaningVi = w.meaningVi.replace(/\s+/g, ' ').trim();
    });

    return { words, groups };
  } else if (hasTableFormat) {
    // ---------------- Table Format Parser (for split column layouts) ----------------
    // Filter out headers
    const isHeaderLine = (line) => {
      const norm = line.toLowerCase();
      return (
        norm.includes('từ vựng tiếng anh chuyên ngành sql') ||
        norm.includes('& database') ||
        norm.includes('ứng dụng phương pháp active recall') ||
        norm.includes('từ vựngphiên âmnghĩa tiếng') ||
        norm.includes('nghĩa tiếng anh (ngữ cảnh)') ||
        norm === 'việt' ||
        norm === 'từ vựng' ||
        norm === 'phiên âm'
      );
    };

    const cleanLines = [];
    for (let line of rawLines) {
      if (isHeaderLine(line)) {
        continue;
      }
      cleanLines.push(line);
    }

    // Find phonetic ranges
    const phoneticRanges = [];
    for (let i = 0; i < cleanLines.length; i++) {
      const line = cleanLines[i];
      if (line.startsWith('/') && !line.match(/^\d+\.\s*(.+)$/)) {
        let pStart = i;
        let pEnd = i;
        for (let j = i; j < cleanLines.length; j++) {
          if (cleanLines[j].endsWith('/') && (j > i || cleanLines[j] !== '/')) {
            pEnd = j;
            break;
          }
          if (j > i && (cleanLines[j].startsWith('/') || cleanLines[j].match(/^\d+\.\s*(.+)$/))) {
            break;
          }
        }
        phoneticRanges.push({ pStart, pEnd });
        i = pEnd;
      }
    }

    // Parse entries
    const entries = [];
    for (let k = 0; k < phoneticRanges.length; k++) {
      const { pStart, pEnd } = phoneticRanges[k];
      
      // Find word lines
      let wordLines = [];
      let idx = pStart - 1;
      const prevEnd = k > 0 ? phoneticRanges[k-1].pEnd : -1;
      while (idx > prevEnd) {
        const line = cleanLines[idx];
        if (line.match(/^\d+\.\s*(.+)$/)) {
          break; // Group header
        }
        if (/[.!?]$/.test(line)) {
          break; // Definition punctuation
        }
        if (containsVietnamese(line)) {
          break; // Vietnamese definition
        }
        wordLines.unshift(line);
        idx--;
      }
      const word = wordLines.join(' ').trim();
      const phonetic = cleanLines.slice(pStart, pEnd + 1).join(' ').trim();

      entries.push({
        pStart,
        pEnd,
        word,
        phonetic,
        wordStart: idx + 1,
      });
    }

    // Parse definitions and groups
    const words = [];
    const groups = [];
    for (let k = 0; k < entries.length; k++) {
      const entry = entries[k];
      
      // Find group
      let group = '';
      for (let idx = 0; idx < entry.pStart; idx++) {
        const match = cleanLines[idx].match(/^\d+\.\s*(.+)$/);
        if (match) {
          group = match[1].trim();
        }
      }
      if (group && !groups.includes(group)) {
        groups.push(group);
      }

      // Find definition lines
      let defEnd = (k < entries.length - 1) ? entries[k+1].wordStart - 1 : cleanLines.length - 1;
      for (let idx = entry.pEnd + 1; idx <= defEnd; idx++) {
        if (cleanLines[idx].match(/^\d+\.\s*(.+)$/)) {
          defEnd = idx - 1;
          break;
        }
      }

      const defLines = cleanLines.slice(entry.pEnd + 1, defEnd + 1);
      const defText = defLines.join(' ').replace(/\s+/g, ' ').trim();

      // Split definition text into meaningVi and englishDefinition
      const splitRegex = /([a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ])\s*([A-Z])/;
      const match = defText.match(splitRegex);
      let meaningVi = defText;
      let englishDefinition = '';
      
      if (match) {
        const index = defText.indexOf(match[2], match.index);
        meaningVi = defText.slice(0, index).trim();
        englishDefinition = defText.slice(index).trim();
      }

      words.push({
        word: entry.word,
        phonetic: entry.phonetic,
        meaningVi,
        englishDefinition,
        group,
      });
    }

    return { words, groups };
  } else if (hasSlashFormat) {
    // ---------------- Slash Format Parser ----------------
    const words = [];
    const groups = [];
    let currentGroup = '';

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];

      // Skip common headings that aren't entries or group headers
      if (line === 'Từ vựngPhiên âmNghĩa tiếng Việt' || (line.includes('Từ vựng') && line.includes('Phiên âm'))) {
        continue;
      }

      // Detect group headers
      const groupMatch = line.match(/^\d+\.\s*(.+)$/);
      if (groupMatch) {
        currentGroup = groupMatch[1].trim();
        if (!groups.includes(currentGroup)) {
          groups.push(currentGroup);
        }
        continue;
      }

      // Detect slash format vocabulary entries
      const slashMatch = line.match(slashPattern);
      if (slashMatch) {
        words.push({
          word: slashMatch[1].trim(),
          phonetic: `/${slashMatch[2].trim()}/`,
          meaningVi: slashMatch[3].trim(),
          group: currentGroup,
        });
      }
    }

    return { words, groups };
  } else {
    // ---------------- Smart Heuristic Parser (non-asterisk TOEIC/Unstructured PDFs) ----------------
    // Filter noise lines
    const vocabLines = rawLines.filter(line => !isNoiseLine(line));

    // Clean up unicode combining marks that split lines
    const mergedLines = [];
    for (let i = 0; i < vocabLines.length; i++) {
      const line = vocabLines[i];
      if (line === '́' || line === '̃' || line === '̣') {
        if (mergedLines.length > 0) {
          mergedLines[mergedLines.length - 1] += line;
        }
      } else {
        mergedLines.push(line);
      }
    }

    // Skip any header noise at the very beginning by starting at the first conjunction "as = "
    let firstVocabIndex = 0;
    for (let i = 0; i < mergedLines.length; i++) {
      const l = mergedLines[i];
      if (l.includes('as =') || l.includes('although =') || l.includes('after')) {
        firstVocabIndex = i;
        break;
      }
    }
    const cleanLines = mergedLines.slice(firstVocabIndex);

    // Find all indices of definition lines (start with '+' or is 'cùng với')
    const defIndices = [];
    for (let i = 0; i < cleanLines.length; i++) {
      const line = cleanLines[i];
      if (line.startsWith('+') || line === 'cùng với') {
        defIndices.push(i);
      }
    }

    const words = [];

    for (let k = 0; k < defIndices.length; k++) {
      const d_k = defIndices[k];

      // 1. Determine the word for d_k
      let w_start = 0;
      if (k > 0) {
        let idx = d_k - 1;
        while (idx > defIndices[k - 1]) {
          const line = cleanLines[idx];
          const isCapitalized = /^[A-Z]/.test(line);
          const endsWithPunctuation = /[.!?]$/.test(line);
          const hasEquals = line.includes('=');
          
          if (hasEquals || (!isCapitalized && !endsWithPunctuation)) {
            idx--;
          } else {
            break;
          }
        }
        w_start = idx + 1;
      }

      const wordLines = cleanLines.slice(w_start, d_k);
      const wordText = wordLines.join(' ').replace(/\s*=\s*/g, ' = ').trim();

      // 2. Scan forward from d_k + 1 to find where the English example starts.
      let exampleStart = d_k + 1;
      let meaningParts = [cleanLines[d_k].replace(/^\+\s*/, '')];

      for (let idx = d_k + 1; idx < cleanLines.length; idx++) {
        if (k < defIndices.length - 1 && idx >= defIndices[k + 1]) {
          break;
        }
        
        const line = cleanLines[idx];
        const isCapitalized = /^[A-Z0-9]/.test(line);
        const hasAccents = containsVietnamese(line);
        const hasEquals = line.includes('=');
        
        if (isCapitalized && !hasAccents && !hasEquals) {
          exampleStart = idx;
          break;
        } else {
          meaningParts.push(line);
        }
      }

      const meaningText = meaningParts.join(' ').trim();

      // 3. Determine the example for d_k
      let next_w_start = cleanLines.length;
      if (k < defIndices.length - 1) {
        let idx = defIndices[k + 1] - 1;
        while (idx > d_k) {
          const line = cleanLines[idx];
          const isCapitalized = /^[A-Z]/.test(line);
          const endsWithPunctuation = /[.!?]$/.test(line);
          const hasEquals = line.includes('=');

          if (hasEquals || (!isCapitalized && !endsWithPunctuation)) {
            idx--;
          } else {
            break;
          }
        }
        next_w_start = idx + 1;
      }

      const exampleLines = cleanLines.slice(exampleStart, next_w_start);
      const exampleText = exampleLines.join(' ').trim();

      words.push({
        word: wordText,
        phonetic: '',
        meaningVi: meaningText.replace(/\s+/g, ' ').trim(),
        exampleSentence: exampleText.replace(/\s+/g, ' ').trim(),
        group: '',
      });
    }

    return { words, groups: [] };
  }
};

module.exports = { parsePdfVocabulary };
