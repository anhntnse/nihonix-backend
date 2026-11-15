import {aiFailure} from './ai-request.service';
export function parseGeneratedJson(content:string):any{
 try{
  if(typeof content!=='string'||content.length>500000)throw new Error();
  const trimmed=content.trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'');
  return JSON.parse(trimmed);
 }catch{throw aiFailure('AI_INVALID_OUTPUT',502,'AI returned invalid output.');}
}
