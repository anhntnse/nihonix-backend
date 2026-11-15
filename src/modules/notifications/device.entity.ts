import {Entity,PrimaryColumn,Column,ManyToOne,JoinColumn,Index} from 'typeorm';
import {User} from '../users/entity/user.entity';
import {Session} from '../auth/entity/session.entity';
@Entity('notification_devices')
@Index('uq_notification_token',['token'],{unique:true})
export class NotificationDevice{
 @PrimaryColumn('uuid')installation_id:string;
 @Column('uuid')user_id:string;
 @Column('varchar')session_id:string;
 @Column('uuid')binding_id:string;
 @Column('text')token:string;
 @Column('boolean')enabled:boolean;
 @Column({type:'timestamptz',default:()=> 'now()'})updated_at:Date;
 @ManyToOne(()=>User,{onDelete:'CASCADE'})@JoinColumn({name:'user_id'})user:User;
 @ManyToOne(()=>Session,{onDelete:'CASCADE'})@JoinColumn({name:'session_id'})session:Session;
}
@Entity('reminder_attempts')
export class ReminderAttempt{
 @PrimaryColumn('uuid')user_id:string;
 @PrimaryColumn('date')day:string;
 @Column('uuid')id:string;
 @Column('text')status:string;
 @Column({type:'timestamptz',default:()=> 'now()'})created_at:Date;
 @ManyToOne(()=>User,{onDelete:'CASCADE'})@JoinColumn({name:'user_id'})user:User;
}
