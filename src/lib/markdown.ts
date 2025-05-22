/**
 * Detects if text contains markdown formatting
 * @param text Text to check for markdown
 * @returns Boolean indicating if text appears to contain markdown
 */
export const isMarkdown = (text: string): boolean => {
  // Check for common markdown patterns
  const markdownPatterns = [
    /\*\*(.*?)\*\*/, // Bold
    /\*(.*?)\*/, // Italic
    /\[(.*?)\]\((.*?)\)/, // Links
    /^#+\s+/m, // Headers
    /^[-*+]\s+/m, // List items
    /^>\s+/m, // Blockquotes
    /```([\s\S]*?)```/, // Code blocks
    /`([^`]+)`/, // Inline code
    /^(\s*)\d+\.\s+/m, // Numbered lists
    /\|\s*([^|]*)\s*\|/, // Tables
    /^-{3,}$/m, // Horizontal rules
    /^={3,}$/m, // Alternative horizontal rules
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
};

/**
 * Cleans markdown formatting for better speech synthesis
 * @param text Markdown text to clean
 * @returns Cleaned text without markdown syntax
 */
export const cleanMarkdown = (text: string): string => {
  // Remove or replace markdown syntax with more speech-friendly text
  let cleanedText = text;

  // Replace links [text](url) with just the text
  cleanedText = cleanedText.replace(/\[(.*?)\]\(.*?\)/g, "$1");

  // Remove bold and italic markers
  cleanedText = cleanedText.replace(/\*\*(.*?)\*\*/g, "$1");
  cleanedText = cleanedText.replace(/\*(.*?)\*/g, "$1");

  // Clean headers
  cleanedText = cleanedText.replace(/^#+\s+(.*?)$/gm, "$1");

  // Clean list items
  cleanedText = cleanedText.replace(/^[-*+]\s+/gm, "- ");

  // Clean numbered lists (keep the numbers)
  cleanedText = cleanedText.replace(/^(\s*)(\d+)\.\s+/gm, "$1$2. ");

  // Remove blockquotes
  cleanedText = cleanedText.replace(/^>\s+/gm, "");

  // Remove code blocks and inline code
  cleanedText = cleanedText.replace(/```[\s\S]*?```/g, "");
  cleanedText = cleanedText.replace(/`([^`]+)`/g, "$1");

  // Remove table formatting
  cleanedText = cleanedText.replace(/\|/g, " ");
  cleanedText = cleanedText.replace(/^[-:| ]+$/gm, "");

  // Remove horizontal rules
  cleanedText = cleanedText.replace(/^-{3,}$/gm, "");
  cleanedText = cleanedText.replace(/^={3,}$/gm, "");

  // Handle multiple consecutive spaces
  cleanedText = cleanedText.replace(/\s+/g, " ");

  // Handle multiple consecutive newlines
  cleanedText = cleanedText.replace(/\n+/g, "\n");

  return cleanedText.trim();
};
