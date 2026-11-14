import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AiService } from './services/ai.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check AI service health' })
  @ApiOkResponse({ description: 'AI service status' })
  async healthCheck(): Promise<{ status: string; configured: boolean }> {
    return this.aiService.healthCheck();
  }
}

