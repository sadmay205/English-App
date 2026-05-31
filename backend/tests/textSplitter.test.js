const test = require('node:test');
const assert = require('node:assert');
const { splitParagraphIntoSentences } = require('../utils/textSplitter');

test('textSplitter - basic splitting on sentence punctuation (. ! ?)', () => {
  const text = 'Hello world. This is a test! Is it working? Yes.';
  const expected = [
    'Hello world.',
    'This is a test!',
    'Is it working?',
    'Yes.'
  ];
  assert.deepStrictEqual(splitParagraphIntoSentences(text), expected);
});

test('textSplitter - handles abbreviations (Dr., Mr., e.g.) to avoid incorrect splits', () => {
  const text = 'Dr. Smith went to the hospital. She met Mr. John, who was waiting in the lobby (e.g. for a checkup).';
  const expected = [
    'Dr. Smith went to the hospital.',
    'She met Mr. John, who was waiting in the lobby (e.g. for a checkup).'
  ];
  assert.deepStrictEqual(splitParagraphIntoSentences(text), expected);
});

test('textSplitter - handles empty and null inputs safely', () => {
  assert.deepStrictEqual(splitParagraphIntoSentences(''), []);
  assert.deepStrictEqual(splitParagraphIntoSentences(null), []);
  assert.deepStrictEqual(splitParagraphIntoSentences(undefined), []);
});
