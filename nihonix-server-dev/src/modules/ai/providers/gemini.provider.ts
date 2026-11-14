import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider, AiMessage, AiProviderConfig, AiProviderResponse } from '../interfaces/ai-provider.interface';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: {
    message: string;
    code: number;
  };
}

@Injectable()
export class GeminiProvider implements IAiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly config: {
    apiKey: string;
    baseUrl: string;
    defaultModel: string;
    maxTokens: number;
    temperature: number;
    maxRetries: number;
  };

  constructor(private configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('ai.apiKey') || '',
      baseUrl: this.configService.get<string>('ai.apiUrl') || 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: this.configService.get<string>('ai.model') || 'gemini-2.0-flash',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000', 10),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      maxRetries: 3,
    };

    if (!this.config.apiKey) {
      this.logger.warn('Google Gemini API key is not configured');
    }
  }

  async generate(
    messages: AiMessage[],
    config?: Partial<AiProviderConfig>,
  ): Promise<AiProviderResponse> {
    const model = config?.defaultModel || this.config.defaultModel;
    const request: GeminiRequest = {
      contents: messages.map((msg) => ({
        parts: [
          {
            text: msg.content,
          },
        ],
      })),
      generationConfig: {
        temperature: config?.temperature ?? this.config.temperature,
        maxOutputTokens: config?.maxTokens ?? this.config.maxTokens,
      },
    };

    const response = await this.makeRequest(model, request);
    return {
      content: response.content,
      usage: response.usage,
    };
  }

  private async makeRequest(
    model: string,
    data: GeminiRequest,
    retryCount: number = 0,
  ): Promise<{ content: string; usage?: any }> {
    try {
      const url = `${this.config.baseUrl}/models/${model}:generateContent`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-goog-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`API request failed: ${response.status}`, errorData);
        throw new BadRequestException(
          `Google Gemini API error: ${errorData.error?.message || 'Unknown error'}`,
        );
      }

      const result: GeminiResponse = await response.json();

      if (result.error) {
        throw new BadRequestException(`Google Gemini API error: ${result.error.message}`);
      }

      if (!result.candidates || result.candidates.length === 0) {
        throw new BadRequestException('No response candidates returned from API');
      }

      const candidate = result.candidates[0];
      const content = candidate.content.parts.map((part) => part.text).join('');

      return {
        content,
        usage: result.usageMetadata
          ? {
              prompt_tokens: result.usageMetadata.promptTokenCount,
              completion_tokens: result.usageMetadata.candidatesTokenCount,
              total_tokens: result.usageMetadata.totalTokenCount,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Request failed (attempt ${retryCount + 1})`, error.stack);

      if (retryCount < this.config.maxRetries) {
        await this.delay(1000 * (retryCount + 1));
        return this.makeRequest(model, data, retryCount + 1);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async healthCheck(): Promise<{ status: string; configured: boolean }> {
    try {
      if (!this.config.apiKey) {
        return {
          status: 'error',
          configured: false,
        };
      }

      return {
        status: 'ok',
        configured: true,
      };
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
      return {
        status: 'error',
        configured: false,
      };
    }
  }
}

