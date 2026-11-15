import {ConfigService} from '@nestjs/config';
import {GeminiProvider} from './gemini.provider';
describe('bounded Gemini calls',()=>{
 const config={get:(key:string)=>key==='ai.apiKey'?'fixture-key':undefined} as ConfigService;
 afterEach(()=>jest.restoreAllMocks());
 it('attaches a deadline and rejects truncated output',async()=>{
  const fetcher=jest.spyOn(global,'fetch').mockResolvedValue(new Response(JSON.stringify({candidates:[{content:{parts:[{text:'[]'}]},finishReason:'MAX_TOKENS'}]})));
  const provider=new GeminiProvider(config);
  await expect(provider.generate([{role:'user',content:'fixture'}],{maxRetries:0} as any)).rejects.toThrow();
  expect(fetcher.mock.calls[0][1]?.signal).toBeDefined();
 });
 it('honors a single-attempt generation request',async()=>{
  const fetcher=jest.spyOn(global,'fetch').mockResolvedValue(new Response('{}',{status:503}));
  const provider=new GeminiProvider(config);jest.spyOn(provider as any,'delay').mockResolvedValue(undefined);
  await expect(provider.generate([{role:'user',content:'fixture'}],{maxRetries:0} as any)).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
 });
});
