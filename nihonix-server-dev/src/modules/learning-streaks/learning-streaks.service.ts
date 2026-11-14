import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UserLearningStreak } from './entity/user-learning-streak.entity';
import { UserLearningActivity } from './entity/user-learning-activity.entity';
import {
  StreakResponseDto,
  ActivityRecordedResponseDto,
  CalendarResponseDto,
  CalendarDayDto,
} from './dto';

@Injectable()
export class LearningStreaksService {
  private readonly logger = new Logger(LearningStreaksService.name);

  constructor(
    @InjectRepository(UserLearningStreak)
    private streakRepository: Repository<UserLearningStreak>,
    @InjectRepository(UserLearningActivity)
    private activityRepository: Repository<UserLearningActivity>,
  ) {}

  async getStreak(userId: string): Promise<StreakResponseDto> {
    let streak = await this.streakRepository.findOne({
      where: { user_id: userId },
    });

    // Nếu chưa có streak, tạo mới
    if (!streak) {
      streak = await this.createNewStreak(userId);
    }

    const today = this.getTodayDate();
    const isTodayCompleted = streak.last_learned_date
      ? this.isSameDay(new Date(streak.last_learned_date), new Date(today))
      : false;

    // Xác định streak status
    let streakStatus = 'new';
    if (streak.current_streak > 0) {
      const daysSinceLastLearned = streak.last_learned_date
        ? this.getDaysDifference(new Date(streak.last_learned_date), new Date(today))
        : 999;

      if (daysSinceLastLearned === 0) {
        streakStatus = 'active'; // Học hôm nay rồi
      } else if (daysSinceLastLearned === 1) {
        streakStatus = 'active'; // Còn cơ hội học tiếp
      } else {
        streakStatus = 'broken'; // Đã bỏ lỡ
      }
    }

    return {
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_learned_date: streak.last_learned_date
        ? this.formatDate(new Date(streak.last_learned_date))
        : null,
      streak_start_date: streak.streak_start_date
        ? this.formatDate(new Date(streak.streak_start_date))
        : null,
      total_learning_days: streak.total_learning_days,
      is_today_completed: isTodayCompleted,
      streak_status: streakStatus,
    };
  }

  async recordActivity(
    userId: string,
    activityType: string,
    activityCount: number = 1,
  ): Promise<ActivityRecordedResponseDto> {
    const today = this.getTodayDate();

    // 1. Ghi nhận activity vào bảng activities
    await this.upsertActivity(userId, today, activityType, activityCount);

    // 2. Lấy hoặc tạo streak
    let streak = await this.streakRepository.findOne({
      where: { user_id: userId },
    });

    if (!streak) {
      streak = await this.createNewStreak(userId);
    }

    // 3. Kiểm tra đã học hôm nay chưa
    const lastLearnedDate = streak.last_learned_date
      ? new Date(streak.last_learned_date)
      : null;
    const todayDate = new Date(today);

    if (lastLearnedDate && this.isSameDay(lastLearnedDate, todayDate)) {
      // Đã học rồi → không cập nhật streak
      return {
        message: 'Activity recorded. You already studied today!',
        streak_updated: false,
        current_streak: streak.current_streak,
        new_record: false,
      };
    }

    // 4. Cập nhật streak
    const wasNewRecord = await this.updateStreak(streak, todayDate);

    return {
      message: 'Great! Streak updated!',
      streak_updated: true,
      current_streak: streak.current_streak,
      new_record: wasNewRecord,
    };
  }

    // Lấy lịch học trong tháng
  async getCalendar(
    userId: string,
    year?: number,
    month?: number,
  ): Promise<CalendarResponseDto> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // Tạo ngày đầu và cuối tháng
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Lấy tất cả activities trong tháng
    const activities = await this.activityRepository.find({
      where: {
        user_id: userId,
        activity_date: Between(startDate, endDate),
      },
      order: { activity_date: 'ASC' },
    });

    const learningDays: CalendarDayDto[] = activities.map((activity) => ({
      date: this.formatDate(new Date(activity.activity_date)),
      activity_count: activity.activity_count,
    }));

    return {
      year: targetYear,
      month: targetMonth,
      learning_days: learningDays,
      total_days: learningDays.length,
    };
  }

  private async createNewStreak(userId: string): Promise<UserLearningStreak> {
    const newStreak = this.streakRepository.create({
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_learned_date: null,
      streak_start_date: null,
      total_learning_days: 0,
    });

    return this.streakRepository.save(newStreak);
  }

  /**
   * Cập nhật streak khi user học
   * @returns true nếu phá kỷ lục
   */
  private async updateStreak(
    streak: UserLearningStreak,
    today: Date,
  ): Promise<boolean> {
    const lastDate = streak.last_learned_date
      ? new Date(streak.last_learned_date)
      : null;

    if (!lastDate) {
      // Lần đầu tiên học
      streak.current_streak = 1;
      streak.streak_start_date = today;
    } else {
      const daysDiff = this.getDaysDifference(lastDate, today);

      if (daysDiff === 1) {
        // Học liên tiếp
        streak.current_streak += 1;
      } else if (daysDiff > 1) {
        // Bỏ lỡ → reset
        streak.current_streak = 1;
        streak.streak_start_date = today;
      }
      // daysDiff === 0 không nên xảy ra vì đã check ở trên
    }

    // Cập nhật longest_streak nếu cần
    let isNewRecord = false;
    if (streak.current_streak > streak.longest_streak) {
      streak.longest_streak = streak.current_streak;
      isNewRecord = true;
    }

    // Cập nhật last_learned_date và total_learning_days
    streak.last_learned_date = today;
    streak.total_learning_days += 1;

    await this.streakRepository.save(streak);

    return isNewRecord;
  }

  /**
   * Ghi nhận activity (upsert)
   */
  private async upsertActivity(
    userId: string,
    date: Date,
    activityType: string,
    count: number,
  ): Promise<void> {
    const existing = await this.activityRepository.findOne({
      where: {
        user_id: userId,
        activity_date: date,
      },
    });

    if (existing) {
      // Tăng count
      existing.activity_count += count;
      existing.activity_type = activityType; // Cập nhật loại gần nhất
      await this.activityRepository.save(existing);
    } else {
      // Tạo mới
      const newActivity = this.activityRepository.create({
        user_id: userId,
        activity_date: date,
        activity_count: count,
        activity_type: activityType,
      });
      await this.activityRepository.save(newActivity);
    }
  }

  /**
   * Helpers
   */
  private getTodayDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    const diff = d2.getTime() - d1.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

