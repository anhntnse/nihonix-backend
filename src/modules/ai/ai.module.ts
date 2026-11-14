import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './services/ai.service';
import { AiJsonParserService } from './services/ai-json-parser.service';
import { AiGenerationService } from './services/ai-generation.service';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  controllers: [AiController],
  providers: [
    ConfigService,
    AiService,
    AiJsonParserService,
    // Provide AiGenerationService with GeminiProvider as default provider
    {
      provide: AiGenerationService,
      useFactory: (geminiProvider: GeminiProvider, configService: ConfigService) => {
        return new AiGenerationService(geminiProvider, configService);
      },
      inject: [GeminiProvider, ConfigService],
    },
    OpenRouterProvider,
    GeminiProvider,
  ],
  exports: [
    AiService,
    AiJsonParserService,
    AiGenerationService,
    OpenRouterProvider,
    GeminiProvider,
  ],
})
export class AiModule {}

