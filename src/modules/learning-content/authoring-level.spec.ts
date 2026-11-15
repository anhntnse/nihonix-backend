import { Logger } from '@nestjs/common';
import { VocabularyItemsService } from '../vocabulary-items/services/vocabulary-items.service';
import { GrammarPatternsService } from '../grammar-patterns/services/grammar-patterns.service';

describe('Catalog authoring parent-level integrity',()=>{
  const text={vi:'Chào',en:'Hello',jp:'こんにちは'};
  const example={sentence_jp:'こんにちは',sentence_romaji:'konnichiwa',sentence_vi:'Xin chào',sentence_en:'Hello'};
  const repository=()=>({findOne:jest.fn(async()=>null),create:jest.fn(value=>value),save:jest.fn(async value=>({...value,id:'set-id'})),delete:jest.fn()});
  let ai:any,parser:any,words:any,sets:any,patterns:any,topics:any,groups:any;
  beforeEach(()=>{
    jest.spyOn(Logger.prototype,'error').mockImplementation(()=>{});
    jest.spyOn(Logger.prototype,'log').mockImplementation(()=>{});
    ai={generateWithRetry:jest.fn(async()=>({content:'mock',usage:{}}))};
    parser={parseJson:jest.fn()};
    words=repository();sets=repository();patterns=repository();
    topics={findOne:jest.fn(async()=>({id:'topic-id',slug:'travel',level_code:'N3'}))};
    groups={findOne:jest.fn(async()=>({slug:'travel-grammar',level_code:'N3',topic:{slug:'travel'}}))};
  });
  afterEach(()=>jest.restoreAllMocks());
  it('rejects vocabulary level conflicts before calling AI',async()=>{
    const service=new VocabularyItemsService(words,sets,topics,ai,parser);
    await expect(service.generateVocabulary({topic_id:'topic-id',level_code:'N5'})).rejects.toMatchObject({status:400});
    expect(ai.generateWithRetry).not.toHaveBeenCalled();expect(words.save).not.toHaveBeenCalled();
  });
  it('inherits vocabulary level from its topic when omitted',async()=>{
    parser.parseJson.mockReturnValue({set_title:text,items:[{romaji:'hello',kana:'こんにちは',meaning:text,word_type:'noun',examples:[example]}]});
    const service=new VocabularyItemsService(words,sets,topics,ai,parser);
    const result=await service.generateVocabulary({topic_id:'topic-id',count:1});
    expect(result.level_code).toBe('N3');expect(words.save).toHaveBeenCalledWith(expect.objectContaining({level_code:'N3'}));
  });
  it('rejects grammar level conflicts before calling AI',async()=>{
    const service=new GrammarPatternsService(patterns,groups,ai,parser);
    await expect(service.generateGrammar({grammar_sub_topic_slug:'travel-grammar',level_code:'N5'})).rejects.toMatchObject({status:400});
    expect(ai.generateWithRetry).not.toHaveBeenCalled();
  });
  it('inherits grammar level from its parent group',async()=>{
    parser.parseJson.mockReturnValue([{pattern_jp:'です',pattern_romaji:'desu',explanation:text,usage_examples:[example,example],grammar_points:['polite','present']}]);
    const service=new GrammarPatternsService(patterns,groups,ai,parser);
    const result=await service.generateGrammar({grammar_sub_topic_slug:'travel-grammar',count:1});
    expect(result.level_code).toBe('N3');expect(patterns.save).toHaveBeenCalledWith(expect.objectContaining({level_code:'N3',topic_slug:'travel'}));
  });
});
