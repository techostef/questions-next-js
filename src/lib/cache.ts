/* eslint-disable @typescript-eslint/no-explicit-any */
// A simple in-memory cache using Map to store chat API results
const chatCache = new Map<string, any[]>();

export function getCachedResult(key: string): any[] | null {
  return chatCache.has(key) ? chatCache.get(key)! : null;
}

export function setCachedResult(key: string, value: any): void {
  if (chatCache.has(key)) {
    const currentValues = chatCache.get(key)!;
    chatCache.set(key, [...currentValues, value]);
  } else {
    chatCache.set(key, [value]);
  }
}

export function getAllCachedResults(): Record<string, any> {
  // Convert Map to a plain object for compatibility with existing code
  return Object.fromEntries(chatCache);
}

export function setAllCachedResults(data: Record<string, any>): void {
  // Clear the existing Map
  chatCache.clear();
  
  // Add all entries from the data object to the Map
  Object.entries(data).forEach(([key, value]) => {
    chatCache.set(key, Array.isArray(value) ? value : [value]);
  });
}