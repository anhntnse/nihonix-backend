import {Injectable,Logger,HttpException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {IAiProvider,AiMessage,AiProviderConfig,AiProviderResponse} from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements IAiProvider {
 private readonly logger=new Logger(GeminiProvider.name);
 constructor(private readonly configService:ConfigService){}
 async generate(messages:AiMessage[],config?:Partial<AiProviderConfig>):Promise<AiProviderResponse>{
  const key=this.configService.get<string>('ai.apiKey')||'';
  if(!key)throw new HttpException({code:'AI_UNAVAILABLE',message:'AI is not configured.'},503);
  const base=this.configService.get<string>('ai.apiUrl')||'https://generativelanguage.googleapis.com/v1beta';
  const model=config?.defaultModel||this.configService.get<string>('ai.model')||'gemini-2.0-flash';
  const retries=Math.max(0,Math.min(config?.maxRetries??3,3));
  for(let attempt=0;;attempt++){
   try{
    const response=await fetch(base.replace(/\/$/,'')+'/models/'+encodeURIComponent(model)+':generateContent',{
     method:'POST',headers:{'X-goog-api-key':key,'Content-Type':'application/json'},
     signal:AbortSignal.timeout(Math.min(Math.max(config?.timeoutMs??45000,1000),60000)),
     body:JSON.stringify({contents:messages.map(m=>({parts:[{text:m.content}]})),
      generationConfig:{temperature:config?.temperature??this.configService.get<number>('ai.temperature')??0.7,
       maxOutputTokens:config?.maxTokens??this.configService.get<number>('ai.maxTokens')??2000}})
    });
    if(!response.ok)throw new HttpException({code:response.status===429?'AI_PROVIDER_BUSY':'AI_PROVIDER_UNAVAILABLE',message:'AI provider is unavailable.'},503);
    const result:any=await response.json(),candidate=result.candidates?.[0];
    if(candidate?.finishReason!=='STOP'||!Array.isArray(candidate.content?.parts))throw new HttpException({code:'AI_INVALID_OUTPUT',message:'AI output was incomplete.'},502);
    const content=candidate.content.parts.filter((p:any)=>typeof p.text==='string'&&!p.thought).map((p:any)=>p.text).join('');
    if(!content.trim()||content.length>500000)throw new HttpException({code:'AI_INVALID_OUTPUT',message:'AI output was invalid.'},502);
    const usage=result.usageMetadata;
    return {content,usage:usage?{prompt_tokens:usage.promptTokenCount,completion_tokens:usage.candidatesTokenCount,total_tokens:usage.totalTokenCount}:undefined};
   }catch(error:any){
    const failure=error instanceof HttpException?error:new HttpException({code:error?.name==='TimeoutError'||error?.name==='AbortError'?'AI_TIMEOUT':'AI_PROVIDER_UNAVAILABLE',message:'AI request could not complete.'},error?.name==='TimeoutError'||error?.name==='AbortError'?504:503);
    if(attempt>=retries)throw failure;
    this.logger.warn(JSON.stringify({event:'ai.provider_retry',attempt:attempt+1,status:failure.getStatus()}));
    await this.delay(1000*(attempt+1));
   }
  }
 }
 private delay(ms:number):Promise<void>{return new Promise(resolve=>setTimeout(resolve,ms));}
 async healthCheck(){const configured=Boolean(this.configService.get<string>('ai.apiKey'));return {status:configured?'ok':'unavailable',configured};}
}
