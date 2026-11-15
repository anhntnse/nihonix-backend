import {Entity,PrimaryColumn,Column,ManyToOne,JoinColumn,Index} from 'typeorm';
import {User} from '../users/entity/user.entity';
@Entity('ai_generation_requests')
@Index('idx_ai_request_quota',['user_id','bucket','day','state'])
export class AiGenerationRequest {
 @PrimaryColumn('uuid') user_id:string;
 @PrimaryColumn('uuid') request_id:string;
 @Column('text') kind:string;
 @Column('text') bucket:string;
 @Column('date') day:string;
 @Column('text') payload_hash:string;
 @Column('text') state:string;
 @Column({type:'jsonb',nullable:true}) result:any;
 @Column({type:'text',nullable:true}) error_code:string|null;
 @Column({type:'int',nullable:true}) error_status:number|null;
 @Column('timestamptz') lease_expires_at:Date;
 @Column({type:'timestamptz',default:()=> 'now()'}) created_at:Date;
 @Column({type:'timestamptz',default:()=> 'now()'}) updated_at:Date;
 @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'user_id'}) user:User;
}
