import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LearningStreaksService } from './learning-streaks.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { User } from '@users/entity/user.entity';
import {
  RecordActivityDto,
  StreakResponseDto,
  ActivityRecordedResponseDto,
  CalendarResponseDto,
  CalendarQueryDto,
} from './dto';

// Decorator để lấy user từ request (cần tạo nếu chưa có)
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

@ApiTags('Learning Streaks')
@ApiBearerAuth()
@Controller('learning-streaks')
@UseGuards(JwtAuthGuard)
export class LearningStreaksController {
  constructor(private readonly streaksService: LearningStreaksService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy thông tin streak của user hiện tại' })
  @ApiOkResponse({
    description: 'Thông tin streak',
    type: StreakResponseDto,
  })
  async getStreak(@CurrentUser() user: User): Promise<StreakResponseDto> {
    return this.streaksService.getStreak(user.id);
  }

  @Post('activity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ghi nhận hoạt động học' })
  @ApiOkResponse({
    description: 'Activity đã được ghi nhận',
    type: ActivityRecordedResponseDto,
  })
  async recordActivity(
    @CurrentUser() user: User,
    @Body() dto: RecordActivityDto,
  ): Promise<ActivityRecordedResponseDto> {
    return this.streaksService.recordActivity(
      user.id,
      dto.activity_type,
      dto.activity_count,
    );
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Lấy lịch học trong tháng' })
  @ApiQuery({ name: 'year', required: false, description: 'Năm (VD: 2025)' })
  @ApiQuery({ name: 'month', required: false, description: 'Tháng (1-12)' })
  @ApiOkResponse({
    description: 'Lịch học trong tháng',
    type: CalendarResponseDto,
  })
  async getCalendar(
    @CurrentUser() user: User,
    @Query() query: CalendarQueryDto,
  ): Promise<CalendarResponseDto> {
    return this.streaksService.getCalendar(user.id, query.year, query.month);
  }
}

