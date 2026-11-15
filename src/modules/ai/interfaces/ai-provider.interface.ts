export interface AiProviderConfig {
  apiKey: string;
  apiUrl: string;
  model?: string;
  defaultModel?: string;
  maxTokens?: number;
  maxRetries?: number;
  timeoutMs?: number;
  temperature?: number;
  siteUrl?: string;
  siteName?: string;
}

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiProviderResponse {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface IAiProvider {
  generate(messages: AiMessage[], config?: Partial<AiProviderConfig>): Promise<AiProviderResponse>;
  healthCheck(): Promise<{ status: string; configured: boolean }>;
}

