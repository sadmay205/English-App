/**
 * Splits a paragraph of text into an array of sentences.
 * Handles abbreviations to avoid false splitting (e.g., Mr., Ms., Dr., e.g., i.e., etc.)
 * @param {string} text - The input paragraph
 * @returns {string[]} Array of sentences
 */
const splitParagraphIntoSentences = (text) => {
  if (!text) return [];
  
  // Basic split on punctuation (. ! ?) followed by whitespace
  // Using lookbehind so the punctuation remains at the end of each sentence
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.trim().length > 0);

  // Post-processing to join sentences that were split incorrectly on common abbreviations
  const abbreviations = ['mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'e.g.', 'i.e.', 'vs.', 'a.m.', 'p.m.', 'etc.'];
  const result = [];
  let currentSentence = '';

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if (currentSentence) {
      currentSentence += ' ' + s;
    } else {
      currentSentence = s;
    }

    // Check if the current sentence ends with one of the abbreviations
    const words = currentSentence.trim().split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase();
    
    const endsWithAbbreviation = abbreviations.some(abbr => lastWord === abbr || lastWord.endsWith('.' + abbr));

    if (!endsWithAbbreviation) {
      result.push(currentSentence.trim());
      currentSentence = '';
    }
  }

  if (currentSentence) {
    result.push(currentSentence.trim());
  }

  return result;
};

module.exports = { splitParagraphIntoSentences };
