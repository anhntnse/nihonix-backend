import { Injectable } from '@nestjs/common';
import { OpenRouterProvider } from '../providers/openrouter.provider';

@Injectable()
export class AiService {
  constructor(private openRouterProvider: OpenRouterProvider) {}

  /**
   * Health check cho AI service
   */
  async healthCheck(): Promise<{ status: string; configured: boolean }> {
    return this.openRouterProvider.healthCheck();
  }
}
