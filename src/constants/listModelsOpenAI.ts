export interface OpenAIModel {
  name: string;
  description: string;
  type: 'chat' | 'audio' | 'both';
  isRecommended?: boolean;
}

export const listModelsOpenAI: OpenAIModel[] = [
  {
    name: "text-davinci-003",
    description: "Most capable text-completion model in the Davinci series",
    type: 'chat'
  },
  {
    name: "text-davinci-002",
    description: "Prior-generation Davinci text-completion model",
    type: 'chat'
  },
  {
    name: "text-curie-001",
    description: "Balanced speed and quality for text-completion",
    type: 'chat'
  },
  {
    name: "text-babbage-001",
    description: "Good for straightforward tasks at modest speed",
    type: 'chat'
  },
  {
    name: "text-ada-001",
    description: "Fastest model for simple tasks and experiments",
    type: 'chat'
  },

  {
    name: "gpt-4",
    description: "Most capable conversational model with 8K context",
    type: 'chat'
  },
  {
    name: "gpt-4-0613",
    description: "GPT-4 variant with function-calling support",
    type: 'chat'
  },
  {
    name: "gpt-4-32k",
    description: "GPT-4 with extended 32K-token context window",
    type: 'chat'
  },
  {
    name: "gpt-4-32k-0613",
    description: "32K-context GPT-4 variant with function calling",
    type: 'chat'
  },
  { 
    name: "gpt-4-turbo", 
    description: "Lower-cost, faster variant of GPT-4",
    type: 'chat'
  },
  {
    name: "gpt-4o",
    description: "Omni model: multimodal understanding & response",
    type: 'chat'
  },
  {
    name: "gpt-4o-mini",
    description: "Compact version of GPT-4o for lightweight reasoning",
    type: 'chat'
  },
  { 
    name: "gpt-4.1", 
    description: "Next-gen GPT-4.1 with improved reasoning",
    type: 'chat',
    isRecommended: true
  },
  { 
    name: "gpt-4.1-mini", 
    description: "Smaller footprint GPT-4.1 variant",
    type: 'chat',
    isRecommended: true 
  },
  {
    name: "gpt-4.1-nano",
    description: "Ultra-compact GPT-4.1 for edge use cases",
    type: 'chat'
  },
  {
    name: "gpt-4.5",
    description: "Orion: enhanced GPT-4.5 with broader capabilities",
    type: 'chat'
  },

  {
    name: "gpt-3.5-turbo",
    description: "High-performance, lower-cost conversational model",
    type: 'chat',
    isRecommended: true
  },
  {
    name: "gpt-3.5-turbo-16k",
    description: "GPT-3.5-turbo with extended 16K-token context",
    type: 'chat'
  },

  {
    name: "code-davinci-002",
    description: "Most capable code-completion model",
    type: 'chat'
  },
  {
    name: "code-cushman-001",
    description: "Faster, lighter code model with good performance",
    type: 'chat'
  },

  {
    name: "text-embedding-ada-002",
    description: "Versatile embedding model for text similarity and search",
    type: 'both'
  },

  { 
    name: "whisper-1", 
    description: "Robust speech-to-text (ASR) model",
    type: 'audio',
    isRecommended: true
  },

  { 
    name: "dall-e-3", 
    description: "Advanced image-generation model",
    type: 'both'
  },

  {
    name: "text-moderation-stable",
    description: "Content filtering for text inputs",
    type: 'both'
  },
  {
    name: "text-moderation-latest",
    description: "Newest version of text content moderation",
    type: 'both'
  },
  {
    name: "omni-moderation-latest",
    description: "Multimodal moderation for text and images",
    type: 'both'
  },

  { 
    name: "o1", 
    description: "Preview reasoning model (pro mode)",
    type: 'chat'
  },
  { 
    name: "o3", 
    description: "Optimized reasoning model",
    type: 'chat'
  },
  { 
    name: "o3-mini", 
    description: "Compact version of O3 reasoning",
    type: 'chat'
  },
  { 
    name: "o3-mini-high", 
    description: "High-capacity compact O3 model",
    type: 'chat'
  },
  { 
    name: "o4-mini", 
    description: "Miniature O4 reasoning model",
    type: 'chat'
  },
  { 
    name: "o4-mini-high", 
    description: "High-capacity miniature O4 model",
    type: 'chat'
  },
];

// Function to get models by type
export function getModelsByType(type: 'chat' | 'audio' | 'both'): OpenAIModel[] {
  return listModelsOpenAI.filter(model => 
    model.type === type || model.type === 'both'
  );
}

// Function to get recommended models by type
export function getRecommendedModelsByType(type: 'chat' | 'audio' | 'both'): OpenAIModel[] {
  return getModelsByType(type).filter(model => model.isRecommended);
}

// Default model selections
export const DEFAULT_CHAT_MODEL = "gpt-4.1-mini";
export const DEFAULT_AUDIO_MODEL = "whisper-1";
