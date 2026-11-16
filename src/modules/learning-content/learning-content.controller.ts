import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { LearningContentService } from './learning-content.service';
import { LearningQueryDto } from './learning-query.dto';

/** Authenticated catalog projection; authoring remains on the existing Admin-only routes. */
@Controller('catalog')
@UseGuards(JwtAuthGuard)
export class LearningContentController {
  constructor(private readonly content: LearningContentService) {}
  @Get('manifest')
  manifest() { return this.content.manifest(); }
  @Get(':kind')
  page(@Param('kind') kind: string,@Query() query: LearningQueryDto) { return this.content.page(kind,query); }
  @Get(':kind/:identifier')
  detail(@Param('kind') kind: string,@Param('identifier') identifier: string) { return this.content.detail(kind,identifier); }
}
