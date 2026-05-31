/**
 * Utilities for emoji-only message detection and formatting.
 */

const emojiCodeRanges: Array<[number, number]> = [
  [0x1f300, 0x1f5ff],
  [0x1f600, 0x1f64f],
  [0x1f680, 0x1f6ff],
  [0x1f700, 0x1f77f],
  [0x1f780, 0x1f7ff],
  [0x1f800, 0x1f8ff],
  [0x1f900, 0x1f9ff],
  [0x1fa00, 0x1faff],
  [0x2600, 0x26ff],
  [0x2700, 0x27bf],
  [0x1f000, 0x1f02f],
  [0x1f0a0, 0x1f0ff],
];

const isEmojiCodePoint = (codePoint: number): boolean => {
  if (codePoint === 0x200d || codePoint === 0xfe0f) return true;
  for (let i = 0; i < emojiCodeRanges.length; i += 1) {
    const range = emojiCodeRanges[i];
    if (codePoint >= range[0] && codePoint <= range[1]) {
      return true;
    }
  }
  return false;
};

const getCodePoint = (
  text: string,
  index: number,
): { codePoint: number; nextIndex: number } => {
  const first = text.charCodeAt(index);
  if (first >= 0xd800 && first <= 0xdbff && index + 1 < text.length) {
    const second = text.charCodeAt(index + 1);
    if (second >= 0xdc00 && second <= 0xdfff) {
      return {
        codePoint: ((first - 0xd800) << 10) + (second - 0xdc00) + 0x10000,
        nextIndex: 2,
      };
    }
  }
  return { codePoint: first, nextIndex: 1 };
};

export const extractEmojiSequences = (text: string): string[] => {
  if (!text) return [];

  const sequences: string[] = [];
  let currentSequence = "";
  let index = 0;

  while (index < text.length) {
    const { codePoint, nextIndex } = getCodePoint(text, index);
    const char = text.substr(index, nextIndex);
    const isEmoji = isEmojiCodePoint(codePoint);

    if (isEmoji) {
      currentSequence += char;
    } else if (currentSequence) {
      sequences.push(currentSequence);
      currentSequence = "";
    }

    index += nextIndex;
  }

  if (currentSequence) {
    sequences.push(currentSequence);
  }

  return sequences;
};

export const isEmojiOnlyMessage = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const emojis = extractEmojiSequences(trimmed);
  return emojis.length > 0 && emojis.join("") === trimmed;
};

export const isSingleOrPairEmojiMessage = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const emojis = extractEmojiSequences(trimmed);
  return emojis.length > 0 && emojis.length <= 2 && emojis.join("") === trimmed;
};
