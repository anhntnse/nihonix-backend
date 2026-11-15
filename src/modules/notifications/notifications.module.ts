import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {NotificationDevice,ReminderAttempt} from './device.entity';
import {NotificationsController} from './notifications.controller';
import {NotificationsService} from './notifications.service';
import {FcmProvider} from './fcm.provider';
import {ReminderService} from './reminder.service';
@Module({imports:[TypeOrmModule.forFeature([NotificationDevice,ReminderAttempt])],controllers:[NotificationsController],
 providers:[NotificationsService,FcmProvider,ReminderService],exports:[NotificationsService,ReminderService]})
export class NotificationsModule{}
