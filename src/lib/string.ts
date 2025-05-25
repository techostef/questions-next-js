// Define proper types for the data in cleanUpResult
type ContentObject = { content?: string };
type APIResponse = string | ContentObject;

// Function to split text into speakable chunks
export const splitTextIntoChunks = (text: string, maxChunkLength: number): string[] => {
  // Regular expression that preserves technical terms like next.js, react.js
  // It looks for sentence boundaries but ignores periods in patterns like word.word
  
  // First, find technical terms (like next.js, react.js) and convert them for better speech synthesis
  // We'll replace dots with spaces for better pronunciation (next.js -> next js)
  const technicalTerms: {original: string, speech: string}[] = [];
  const protectedText = text.replace(/\b\w+\.\w+\b/g, (match) => {
    // Create a speech-friendly version with dot replaced by space
    const speechVersion = match.replace(/\./g, ' ');
    technicalTerms.push({
      original: match,
      speech: speechVersion
    });
    return `__TECHTERM${technicalTerms.length - 1}__`;
  });
  
  // Now split on actual sentence boundaries
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const rawChunks = protectedText.match(sentenceRegex) || [protectedText];
  const result: string[] = [];
  
  // Now ensure no chunk is too long by further splitting if needed
  rawChunks.forEach(chunk => {
    if (chunk.length <= maxChunkLength) {
      result.push(chunk);
    } else {
      // If a sentence is too long, split by commas
      const commaChunks = chunk.split(/,\s+/);
      let currentChunk = '';
      
      commaChunks.forEach(commaChunk => {
        if (currentChunk.length + commaChunk.length < maxChunkLength) {
          currentChunk += (currentChunk ? ', ' : '') + commaChunk;
        } else {
          if (currentChunk) result.push(currentChunk);
          currentChunk = commaChunk;
        }
      });
      
      if (currentChunk) result.push(currentChunk);
    }
  });
  
  // Restore technical terms with speech-friendly versions (dots replaced with spaces)
  const finalResult = result.map(chunk => {
    return chunk.replace(/__TECHTERM(\d+)__/g, (_, index) => {
      // Use the speech-friendly version (with dots replaced by spaces)
      return technicalTerms[parseInt(index)].speech;
    });
  });
  
  return finalResult;
};

export const cleanUpResult = (data: APIResponse) => {
  try {
    // Handle object with content property
    if (typeof data !== "string") {
      if (!data.content) {
        return data.content;
      }
      if (typeof data.content === "string") {
        if (data.content.includes("```json")) {
          const jsonContent = data.content
            .split("```json")[1]
            .split("```")[0];
          return JSON.parse(jsonContent);
        } else {
          return JSON.parse(data.content);
        }
      }
      return null;
    }

    // Handle string data
    if (!data.includes("```json")) {
      return JSON.parse(data);
    }
    const jsonContent = data.split("```json")[1].split("```")[0];
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error("Invalid JSON format. Please check your input.", error);
    return null;
  }
};

export function findMistakes(original, test) {
  // Helper function to clean and split text into words
  const clean = (str) =>
    str
      .toLowerCase()
      .replace(/[.,!?;:"']/g, "") // remove punctuation
      .split(/\s+/) // split by any whitespace
      .filter((w) => w.length > 0); // remove empty strings

  const originalWords = clean(original);
  const testWords = clean(test);

  // Use Levenshtein distance to find best alignment
  const results = findBestAlignment(originalWords, testWords);
  return results;
}

export function findBestAlignment(originalWords: string[], testWords: string[]) {
  // Use dynamic programming to find the best alignment
  const mistakes = [];
  let i = 0;
  let j = 0;

  // Track previous matches to detect substitution patterns
  const substitutions = {};

  while (i < originalWords.length && j < testWords.length) {
    if (originalWords[i] === testWords[j]) {
      // Words match exactly
      i++;
      j++;
    } else if (
      j + 1 < testWords.length &&
      originalWords[i] === testWords[j + 1]
    ) {
      // Extra word in test - skip it
      j++;
    } else if (
      i + 1 < originalWords.length &&
      originalWords[i + 1] === testWords[j]
    ) {
      // Missing word in test
      mistakes.push({
        index: i,
        word: originalWords[i],
        type: "missing",
        context: getContext(originalWords, i),
      });
      i++;
    } else {
      // Word substitution - check for phonetic or semantic similarity
      if (areSimilarWords(originalWords[i], testWords[j])) {
        // Similar but not exact match
        substitutions[originalWords[i]] = testWords[j];
        mistakes.push({
          index: i,
          word: originalWords[i],
          type: "substitution",
          replacement: testWords[j],
          context: getContext(originalWords, i),
        });
      } else {
        // Completely different words
        mistakes.push({
          index: i,
          word: originalWords[i],
          type: "missing",
          context: getContext(originalWords, i),
        });
      }
      i++;
      j++;
    }
  }

  // Add remaining missing words from original
  while (i < originalWords.length) {
    mistakes.push({
      index: i,
      word: originalWords[i],
      type: "missing",
      context: getContext(originalWords, i),
    });
    i++;
  }

  return mistakes;
}

// Check if words are similar (could be expanded with more sophisticated checks)
export function areSimilarWords(word1: string, word2: string) {
  // Simple character-based similarity
  const similarity = calculateSimilarity(word1, word2);
  return similarity > 0.5; // Threshold for similarity
}

// Calculate string similarity ratio using Levenshtein distance
export function calculateSimilarity(s1: string, s2: string) {
  if (s1.length === 0 || s2.length === 0) return 0;

  // Calculate Levenshtein distance
  const track = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }

  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength > 0 ? (maxLength - distance) / maxLength : 1;
}

// Get context around a word to help identify its position
function getContext(words: string[], index: number, windowSize = 2) {
  const start = Math.max(0, index - windowSize);
  const end = Math.min(words.length, index + windowSize + 1);
  return words.slice(start, end).join(" ");
}