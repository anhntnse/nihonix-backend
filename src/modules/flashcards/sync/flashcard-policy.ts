const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateMutation(value:any):string|null {
  if(!['folder','set'].includes(value.kind)||!['upsert','delete'].includes(value.action)||!uuid.test(value.id)) return 'Invalid entity or operation';
  if(!/^\d{1,18}$/.test(String(value.base_version))) return 'Invalid base version';
  if(value.depends_on && (!uuid.test(value.depends_on)||value.depends_on===value.mutation_id)) return 'Invalid dependency';
  if(value.action==='delete') return null;
  if(typeof value.name!=='string'||!value.name.trim()||value.name.length>255) return 'Name must contain 1–255 characters';
  if(value.order!==undefined && (!Number.isInteger(value.order)||value.order<1||value.order>1000000)) return 'Invalid order';
  if(value.kind==='folder') {
    if(value.description!==undefined && (typeof value.description!=='string'||value.description.length>1000)) return 'Description exceeds 1000 characters';
    if(value.cards!==undefined||value.folder_id!==undefined) return 'Folder cannot contain set fields';
    return null;
  }
  if(!uuid.test(value.folder_id)) return 'Invalid folder ID';
  if(!Array.isArray(value.cards)||value.cards.length>200) return 'A set supports at most 200 cards';
  const ids=new Set<string>();
  for(const card of value.cards) {
    if(!uuid.test(card.id)) return 'Invalid card ID';
    const id=card.id.toLowerCase();
    if(ids.has(id)) return 'Duplicate card ID';ids.add(id);
    for(const side of ['front','back']) {
      const face=card[side];
      if(!face||typeof face.text!=='string'||!face.text.trim()||face.text.length>4000 || (face.type!==undefined && face.type!=='text') ||
        (face.meaning!==undefined && (typeof face.meaning!=='string'||face.meaning.length>4000))) return 'Invalid '+side+' text (1–4000 characters)';
    }
    if(card.order!==undefined&&(!Number.isInteger(card.order)||card.order<1||card.order>1000000)) return 'Invalid card order';
  }
  return null;
}
export function dependencyVersion(mutation:any,outcome:any):string|null {
  if(outcome?.status!=='accepted') return null;
  const record=outcome.record;
  if(record?.kind===mutation.kind && record.id===mutation.id) return String(record.version);
  if(mutation.kind==='folder' && outcome.parent?.id===mutation.id) return String(outcome.parent.version);
  return null;
}
export function canonicalJson(value:any):string {
  if(Array.isArray(value)) return '['+value.map(canonicalJson).join(',')+']';
  if(value!==null&&typeof value==='object') return '{'+Object.keys(value).filter(key=>value[key]!==undefined).sort()
    .map(key=>JSON.stringify(key)+':'+canonicalJson(value[key])).join(',')+'}';
  return JSON.stringify(value);
}
