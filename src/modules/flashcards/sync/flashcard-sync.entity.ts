import {Entity,PrimaryColumn,Column,PrimaryGeneratedColumn,ManyToOne,JoinColumn,Index} from 'typeorm';
import {User} from '../../users/entity/user.entity';
@Entity('flashcard_sync_heads')
export class FlashcardSyncHead {
  @PrimaryColumn('uuid') user_id:string;
  @PrimaryColumn('text') kind:string;
  @PrimaryColumn('uuid') id:string;
  @Column('bigint') version:string;
  @Column('boolean',{default:false}) deleted:boolean;
  @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'user_id'}) user:User;
}
@Entity('flashcard_sync_receipts')
@Index(['user_id','mutation_id'],{unique:true})
@Index(['user_id','version'])
export class FlashcardSyncReceipt {
  @PrimaryGeneratedColumn('increment',{type:'bigint'}) version:string;
  @Column('uuid') user_id:string;
  @Column('uuid') mutation_id:string;
  @Column('text') payload_hash:string;
  @Column('jsonb') outcome:any;
  @ManyToOne(()=>User,{onDelete:'CASCADE'}) @JoinColumn({name:'user_id'}) user:User;
}
