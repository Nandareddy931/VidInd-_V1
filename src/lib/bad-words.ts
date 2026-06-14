const BAD_WORDS = [
  "spam",
  "scam",
  "abuse",
  "idiot",
  "trash",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "crap",
  "hack",
  "scammer"
];

/**
 * Checks if the text contains any of the predefined bad words.
 * Handles basic word boundary matches and is case-insensitive.
 */
export function containsBadWords(text: string): boolean {
  if (!text) return false;
  const cleanText = text.toLowerCase();
  return BAD_WORDS.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(cleanText);
  });
}
