import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PracticeService } from './practice.service';
import { GenerateFillBlankDto, GenerateMultipleChoiceDto, SubmitPracticeDto } from './dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@ApiTags('Practice')
@Controller('practice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('fill-blank')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate Fill-in-the-Blank exercises (Vocabulary + Grammar)' })
  @ApiBody({ type: GenerateFillBlankDto })
  @ApiOkResponse({ description: 'Fill-blank exercises generated successfully' })
  async generateFillBlank(
    @Body() dto: GenerateFillBlankDto,
    @Request() req,
  ): Promise<any> {
    return this.practiceService.generateFillBlank(dto, req.user.id);
  }

  @Post('multiple-choice')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate Multiple Choice exercises (Vocabulary + Grammar)' })
  @ApiBody({ type: GenerateMultipleChoiceDto })
  @ApiOkResponse({ description: 'Multiple choice exercises generated successfully' })
  async generateMultipleChoice(
    @Body() dto: GenerateMultipleChoiceDto,
    @Request() req,
  ): Promise<any> {
    return this.practiceService.generateMultipleChoice(dto, req.user.id);
  }

  @Get('sets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all practice sets for current user' })
  @ApiQuery({ name: 'topic_id', required: false, description: 'Filter by topic ID' })
  @ApiQuery({ name: 'exercise_type', required: false, enum: ['fill_blank', 'multiple_choice'], description: 'Filter by exercise type' })
  @ApiQuery({ name: 'status', required: false, enum: ['in_progress', 'completed'], description: 'Filter by status' })
  @ApiOkResponse({ description: 'Practice sets retrieved successfully' })
  async getPracticeSets(
    @Request() req,
    @Query('topic_id') topicId?: string,
    @Query('exercise_type') exerciseType?: 'fill_blank' | 'multiple_choice',
    @Query('status') status?: 'in_progress' | 'completed',
  ): Promise<any> {
    return this.practiceService.getPracticeSets(req.user.id, topicId, exerciseType, status);
  }

  @Get('sets/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get practice set details by ID' })
  @ApiParam({ name: 'id', description: 'Practice set ID (session ID)' })
  @ApiOkResponse({ description: 'Practice set retrieved successfully' })
  async getPracticeSetById(
    @Param('id') sessionId: string,
    @Request() req,
  ): Promise<any> {
    return this.practiceService.getPracticeSetById(sessionId, req.user.id);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit practice answers' })
  @ApiBody({ type: SubmitPracticeDto })
  @ApiOkResponse({ description: 'Practice results' })
  async submitPractice(
    @Body() dto: SubmitPracticeDto,
    @Request() req,
  ): Promise<any> {
    return this.practiceService.submitPractice(dto, req.user.id);
  }
}

