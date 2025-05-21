// Define proper types for the data in cleanUpResult
type ContentObject = { content?: string };
type APIResponse = string | ContentObject;

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