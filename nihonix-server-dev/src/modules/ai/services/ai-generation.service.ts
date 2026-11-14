import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAiProvider, AiMessage } from '../interfaces/ai-provider.interface';

export interface GenerateOptions {
  prompt: string;
  expectedCount?: number;
  tokensPerItem?: number;
  maxRetries?: number;
  retryPrompt?: (basePrompt: string, count: number) => string;
}

@Injectable()
export class AiGenerationService {
  private readonly logger = new Logger(AiGenerationService.name);

  constructor(
    private readonly aiProvider: IAiProvider,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate content with automatic retry logic and dynamic maxTokens
   */
  async generateWithRetry(options: GenerateOptions): Promise<{ content: string; usage?: any }> {
    const {
      prompt,
      expectedCount,
      tokensPerItem = 800,
      maxRetries = 3,
      retryPrompt,
    } = options;

    const model = this.configService.get<string>('ai.model') || 'gemini-2.0-flash';
    const baseMaxTokens = this.configService.get<number>('ai.maxTokens') || 2000;
    const maxTokens = expectedCount
      ? Math.max(baseMaxTokens, expectedCount * tokensPerItem)
      : baseMaxTokens;
    const temperature = this.configService.get<number>('ai.temperature') || 0.7;

    this.logger.debug(`Using maxTokens: ${maxTokens}${expectedCount ? ` for ${expectedCount} items` : ''}`);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const currentPrompt = attempt === 0 ? prompt : retryPrompt?.(prompt, expectedCount || 0) || prompt;

        const messages: AiMessage[] = [
          {
            role: 'user',
            content: currentPrompt,
          },
        ];

        const response = await this.aiProvider.generate(messages, {
          defaultModel: model,
          maxTokens,
          temperature,
        });

        this.logger.debug(`AI Response content (first 500 chars): ${response.content.substring(0, 500)}`);

        return {
          content: response.content,
          usage: response.usage,
        };
      } catch (error: any) {
        // Only retry on network/provider errors, not parsing errors
        // Parsing errors should be handled by the caller
        if (attempt === maxRetries) {
          this.logger.error(`Failed to generate valid response after ${maxRetries + 1} attempts`, error.stack);
          throw new BadRequestException(
            `Failed to generate content after ${maxRetries + 1} attempts. The AI response may be incomplete or invalid. Please try again or reduce the count.`,
          );
        }
        // For other errors, retry if not last attempt
        if (attempt < maxRetries) {
          this.logger.warn(`Retrying AI generation (attempt ${attempt + 2}/${maxRetries + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }
        throw error;
      }
    }

    throw new BadRequestException('No valid content generated from AI response');
  }
}

