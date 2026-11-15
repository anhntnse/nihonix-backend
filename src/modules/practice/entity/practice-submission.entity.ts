import {Entity,PrimaryColumn,Column,ManyToOne,JoinColumn,Unique} from 'typeorm';
import {User} from '../../users/entity/user.entity';
import {PracticeSession} from './practice-session.entity';
@Entity('practice_submissions')
@Unique('uq_practice_submission_request',['user_id','request_id'])
export class PracticeSubmission {
 @PrimaryColumn('uuid') session_id:string;
 @Column('uuid') user_id:string;
 @Column('uuid') request_id:string;
 @Column('text') payload_hash:string;
 @Column('jsonb') result:any;
 @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'user_id'}) user:User;
 @ManyToOne(()=>PracticeSession,{onDelete:'CASCADE'}) @JoinColumn({name:'session_id'}) session:PracticeSession;
}
@Entity('practice_completion_events')
@Unique('uq_practice_completion_session',['session_id'])
export class PracticeCompletionEvent {
 @PrimaryColumn('uuid') id:string;
 @Column('uuid') user_id:string;
 @Column('uuid') session_id:string;
 @Column({type:'text',default:'practice_completed'}) kind:string;
 @Column('timestamptz') completed_at:Date;
 @Column('int') duration_seconds:number;
 @Column({type:'int',default:1}) schema_version:number;
 @Column('jsonb') payload:any;
 @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'user_id'}) user:User;
 @ManyToOne(()=>PracticeSession,{onDelete:'CASCADE'}) @JoinColumn({name:'session_id'}) session:PracticeSession;
}
