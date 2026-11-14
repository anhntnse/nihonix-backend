import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIServiceConfig, OpenRouterRequest, ChatCompletionResponse, OpenRouterResponse, OpenRouterError } from '../interfaces/openrouter.interface';
import { IAiProvider, AiMessage } from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenRouterProvider implements IAiProvider {
  private readonly logger = new Logger(OpenRouterProvider.name);
  private readonly config: AIServiceConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('ai.apiKey') || '',
      baseUrl: this.configService.get<string>('ai.apiUrl') || 'https://openrouter.ai/api/v1',
      siteUrl: this.configService.get<string>('ai.siteUrl') || 'http://localhost:3000',
      siteName: this.configService.get<string>('ai.siteName') || 'Nihonix',
      defaultModel: this.configService.get<string>('ai.model') || 'google/gemini-2.5-pro',
      timeout: 30000,
      maxRetries: 3,
    };

    if (!this.config.apiKey) {
      this.logger.warn('OpenRouter API key is not configured');
    }
  }

  async generate(
    messages: AiMessage[],
    config?: Partial<AIServiceConfig & { temperature?: number; maxTokens?: number }>,
  ): Promise<{ content: string; usage?: any }> {
    const request: OpenRouterRequest = {
      model: config?.defaultModel || this.config.defaultModel,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: (config as any)?.temperature ?? 0.7,
      max_tokens: (config as any)?.maxTokens ?? 2000,
    };

    const response = await this.chatCompletion(request);
    return {
      content: response.content,
      usage: response.usage,
    };
  }

  async chatCompletion(request: OpenRouterRequest): Promise<ChatCompletionResponse> {
    try {

      const response = await this.makeRequest('/chat/completions', request);

      if (this.isErrorResponse(response)) {
        throw new BadRequestException(`OpenRouter API error: ${response.error.message}`);
      }

      const openRouterResponse = response as OpenRouterResponse;

      if (!openRouterResponse.choices || openRouterResponse.choices.length === 0) {
        throw new BadRequestException('No response choices returned from API');
      }

      const choice = openRouterResponse.choices[0];

      return {
        id: openRouterResponse.id,
        model: openRouterResponse.model,
        content: choice.message.content,
        usage: {
          promptTokens: openRouterResponse.usage.prompt_tokens,
          completionTokens: openRouterResponse.usage.completion_tokens,
          totalTokens: openRouterResponse.usage.total_tokens,
        },
        finishReason: choice.finish_reason,
        createdAt: new Date(openRouterResponse.created * 1000),
      };
    } catch (error) {
      this.logger.error('Chat completion failed', error.stack);
      throw error;
    }
  }

  async simpleTextCompletion(
    message: string,
    model?: string,
    temperature: number = 0.7,
  ): Promise<ChatCompletionResponse> {
    const request: OpenRouterRequest = {
      model: model || this.config.defaultModel,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      temperature,
    };

    return this.chatCompletion(request);
  }

  private async makeRequest(
    endpoint: string,
    data: any,
    retryCount: number = 0,
  ): Promise<OpenRouterResponse | OpenRouterError> {
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': this.config.siteUrl,
          'X-Title': this.config.siteName,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`API request failed: ${response.status}`, errorData);
        return errorData as OpenRouterError;
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Request failed (attempt ${retryCount + 1})`, error.stack);

      if (retryCount < (this.config.maxRetries || 3)) {
        await this.delay(1000 * (retryCount + 1));
        return this.makeRequest(endpoint, data, retryCount + 1);
      }

      throw error;
    }
  }

  private isErrorResponse(response: OpenRouterResponse | OpenRouterError): response is OpenRouterError {
    return 'error' in response;
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
