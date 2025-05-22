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