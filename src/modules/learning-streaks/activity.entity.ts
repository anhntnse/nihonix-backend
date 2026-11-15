import {Entity,PrimaryColumn,Column,ManyToOne,JoinColumn,Index} from 'typeorm';
import {User} from '../users/entity/user.entity';
@Entity('learning_activity_events')
@Index('idx_activity_owner_time',['user_id','occurred_at'])
export class LearningActivityEvent{
 @PrimaryColumn('uuid')user_id:string;
 @PrimaryColumn('uuid')id:string;
 @Column('text')payload_hash:string;
 @Column('text')activity_type:string;
 @Column('timestamptz')occurred_at:Date;
 @Column('int')duration_seconds:number;
 @Column('text')timezone:string;
 @Column({type:'text',nullable:true})item_id:string|null;
 @Column('jsonb')slices:Array<{date:string,seconds:number}>;
 @Column({type:'timestamptz',default:()=> 'now()'})created_at:Date;
 @ManyToOne(()=>User,{onDelete:'CASCADE'})@JoinColumn({name:'user_id'})user:User;
}
