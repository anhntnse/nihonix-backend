import { ApiProperty } from '@nestjs/swagger';

export class StreakResponseDto {
  @ApiProperty({ description: 'Chuỗi ngày học hiện tại', example: 7 })
  current_streak!: number;

  @ApiProperty({ description: 'Chuỗi ngày học dài nhất', example: 15 })
  longest_streak!: number;

  @ApiProperty({
    description: 'Ngày học gần nhất',
    example: '2025-11-12',
    nullable: true,
  })
  last_learned_date!: string | null;

  @ApiProperty({
    description: 'Ngày bắt đầu chuỗi hiện tại',
    example: '2025-11-06',
    nullable: true,
  })
  streak_start_date!: string | null;

  @ApiProperty({ description: 'Tổng số ngày đã học', example: 45 })
  total_learning_days!: number;

  @ApiProperty({ description: 'Đã học hôm nay chưa', example: true })
  is_today_completed!: boolean;

  @ApiProperty({
    description: 'Trạng thái streak',
    example: 'active',
    enum: ['active', 'broken', 'new'],
  })
  streak_status!: string;
}

export class ActivityRecordedResponseDto {
  @ApiProperty({ description: 'Message', example: 'Activity recorded' })
  message!: string;

  @ApiProperty({ description: 'Streak có được cập nhật không', example: true })
  streak_updated!: boolean;

  @ApiProperty({ description: 'Chuỗi ngày học hiện tại', example: 8 })
  current_streak!: number;

  @ApiProperty({ description: 'Có phá kỷ lục không', example: false })
  new_record!: boolean;
}

export class CalendarDayDto {
  @ApiProperty({ description: 'Ngày', example: '2025-11-01' })
  date!: string;

  @ApiProperty({ description: 'Số hoạt động trong ngày', example: 5 })
  activity_count!: number;
}

export class CalendarResponseDto {
  @ApiProperty({ description: 'Năm', example: 2025 })
  year!: number;

  @ApiProperty({ description: 'Tháng', example: 11 })
  month!: number;

  @ApiProperty({
    description: 'Các ngày đã học trong tháng',
    type: [CalendarDayDto],
  })
  learning_days!: CalendarDayDto[];

  @ApiProperty({ description: 'Tổng số ngày học trong tháng', example: 15 })
  total_days!: number;
}

