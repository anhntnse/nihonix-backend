import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../users/entity/user.entity';

@Entity('learning_progress')
export class LearningProgress {
  @PrimaryColumn('uuid') user_id:string;
  @PrimaryColumn('text') item_type:string;
  @PrimaryColumn('text') item_id:string;
  @Column('text') status:string;
  @Column('timestamptz') client_updated_at:Date;
  @Column('uuid') mutation_id:string;
  @Column('bigint') version:string;
  @Column('uuid') topic_id:string;
  @Column('text') level_code:string;
  @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'user_id'}) user:User;
}
@Entity('progress_receipts')
@Index(['user_id','mutation_id'],{unique:true})
export class ProgressReceipt {
  @PrimaryGeneratedColumn('increment',{type:'bigint'}) version:string;
  @Column('uuid') user_id:string;
  @Column('uuid') mutation_id:string;
  @Column('text') payload_hash:string;
  @Column('jsonb') outcome:any;
  @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'user_id'}) user:User;
}
