import { IsBoolean, IsInt, IsOptional, IsTimeZone, Matches, Max, Min } from 'class-validator';

export class UpdateLearningSettingsDto {
  @IsOptional() @IsBoolean() push_enabled?: boolean;
  @IsOptional() @IsBoolean() reminder_enabled?: boolean;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) reminder_time?: string;
  @IsOptional() @IsTimeZone() timezone?: string;
  @IsOptional() @IsInt() @Min(1) @Max(1440) daily_goal_minutes?: number;
}

export const DEFAULT_LEARNING_SETTINGS = {
  push_enabled: false, reminder_enabled: false, reminder_time: '20:00',
  timezone: 'UTC', daily_goal_minutes: 15,
};
