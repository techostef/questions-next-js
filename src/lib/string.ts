// Define proper types for the data in cleanUpResult
type ContentObject = { content?: string };
type APIResponse = string | ContentObject;

// Function to split text into speakable chunks
export const splitTextIntoChunks = (text: string, maxChunkLength: number): string[] => {
  // First, try to split on sentences
  const rawChunks = text.match(/[^.!?]+[.!?]+/g) || [text];
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
  
  return result;
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