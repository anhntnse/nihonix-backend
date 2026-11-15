import {EntityManager} from 'typeorm';
export async function folderRecord(db:EntityManager,user:string,id:string):Promise<any|null> {
  const [row]=await db.query(`SELECT f.*,COALESCE(h.version,0)::text AS version FROM flashcard_folders f
    LEFT JOIN flashcard_sync_heads h ON h.user_id=f.user_id AND h.kind='folder' AND h.id=f.id
    WHERE f.id=$1 AND f.user_id=$2`,[id,user]);
  return row?{...row,kind:'folder',deleted:false}:null;
}
export async function setRecord(db:EntityManager,user:string,id:string):Promise<any|null> {
  const [row]=await db.query(`SELECT s.*,f.user_id,COALESCE(h.version,0)::text AS version FROM flashcard_sets s
    JOIN flashcard_folders f ON f.id=s.folder_id
    LEFT JOIN flashcard_sync_heads h ON h.user_id=f.user_id AND h.kind='set' AND h.id=s.id
    WHERE s.id=$1 AND f.user_id=$2`,[id,user]);
  if(!row)return null;
  const cards=await db.query('SELECT * FROM flashcards WHERE set_id=$1 AND folder_id=$2 ORDER BY "order",id',[id,row.folder_id]);
  return {...row,kind:'set',deleted:false,cards,card_count:cards.length};
}
export async function entityRecord(db:EntityManager,user:string,kind:string,id:string) {
  return kind==='folder'?folderRecord(db,user,id):setRecord(db,user,id);
}
export async function writeHead(db:EntityManager,user:string,kind:string,id:string,version:string,deleted=false) {
  await db.query(`INSERT INTO flashcard_sync_heads(user_id,kind,id,version,deleted) VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(user_id,kind,id) DO UPDATE SET version=EXCLUDED.version,deleted=EXCLUDED.deleted`,[user,kind,id,version,deleted]);
}
