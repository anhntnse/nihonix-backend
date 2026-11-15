import { Injectable } from '@nestjs/common';
import { GeminiProvider } from '../providers/gemini.provider';

@Injectable()
export class AiService {
  constructor(private geminiProvider: GeminiProvider) {}

  /**
   * Health check cho AI service
   */
  async healthCheck(): Promise<{ status: string; configured: boolean }> {
    return this.geminiProvider.healthCheck();
  }
}
