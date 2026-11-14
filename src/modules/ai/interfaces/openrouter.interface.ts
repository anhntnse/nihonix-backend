export interface AIServiceConfig {
  apiKey: string;
  baseUrl: string;
  siteUrl: string;
  siteName: string;
  defaultModel: string;
  timeout?: number;
  maxRetries?: number;
}

export interface OpenRouterMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | OpenRouterMessageContent[];
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenRouterChoice {
  message: {
    content: string;
  };
  finish_reason: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  usage: OpenRouterUsage;
  created: number;
}

export interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  createdAt: Date;
}

