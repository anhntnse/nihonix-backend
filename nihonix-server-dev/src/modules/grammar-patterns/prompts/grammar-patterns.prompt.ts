export interface GrammarPatternPromptParams {
  count: number;
  grammarSubTopicSlug: string;
  levelCode: string;
}

export const GRAMMAR_PATTERN_PROMPT_TEMPLATE = (params: GrammarPatternPromptParams): string => {
  const { count, grammarSubTopicSlug, levelCode } = params;
  
  return `Generate EXACTLY ${count} Japanese grammar patterns for the grammar sub-topic "${grammarSubTopicSlug}" at ${levelCode} level.

CRITICAL: You MUST return EXACTLY ${count} patterns in the JSON array. Not more, not less. Return exactly ${count} patterns.

REQUIRED FIELDS (MUST NOT BE NULL OR EMPTY):
- pattern_jp: REQUIRED string - Japanese grammar pattern (e.g., "〜は〜です")
- pattern_romaji: STRONGLY REQUIRED string - Romaji version of the pattern (e.g., "~wa ~desu"). This is essential for learning. DO NOT omit this field.
- explanation: REQUIRED object with exactly 3 fields (all must be non-empty strings):
  * vi: REQUIRED string - Vietnamese explanation
  * en: REQUIRED string - English explanation  
  * jp: REQUIRED string - Japanese explanation
- usage_examples: REQUIRED array with at least 2 example sentences. Each example MUST be an OBJECT (not a string!) with these 4 fields:
  * sentence_jp: string - Japanese sentence
  * sentence_romaji: string - Romaji version
  * sentence_vi: string - Vietnamese translation
  * sentence_en: string - English translation
  IMPORTANT: usage_examples must be an array of OBJECTS, NOT an array of strings!
- grammar_points: REQUIRED array with at least 2-3 grammar points (e.g., ["copula", "basic sentence structure", "describing attributes"])

OPTIONAL FIELDS:
- conjugation_rules: object - Rules for verb/adjective conjugation (include if applicable, otherwise use empty object {})
- level_difficulty: string - Difficulty level (e.g., "beginner", "intermediate", "advanced")

Return as JSON array with this EXACT structure (ALL fields must be present and non-null):
[
  {
    "pattern_jp": "〜は〜です",
    "pattern_romaji": "~wa ~desu",
    "explanation": {
      "vi": "Cấu trúc cơ bản để nói về tính chất hoặc đặc điểm",
      "en": "Basic structure to describe characteristics or attributes",
      "jp": "基本的な構造で特性や特徴を述べる"
    },
    "usage_examples": [
      {
        "sentence_jp": "私は学生です",
        "sentence_romaji": "Watashi wa gakusei desu",
        "sentence_vi": "Tôi là học sinh",
        "sentence_en": "I am a student"
      },
      {
        "sentence_jp": "これは本です",
        "sentence_romaji": "Kore wa hon desu",
        "sentence_vi": "Đây là cuốn sách",
        "sentence_en": "This is a book"
      }
    ],
    "grammar_points": ["copula", "basic sentence structure", "describing attributes"],
    "conjugation_rules": {},
    "level_difficulty": "beginner"
  }
]

CRITICAL RULES - READ CAREFULLY:
1. Return EXACTLY ${count} patterns in the array
2. pattern_jp MUST be a non-empty string for EVERY pattern
3. pattern_romaji MUST be provided for EVERY pattern - DO NOT use null or omit this field
4. explanation MUST be an object with vi, en, jp fields (all non-empty strings)
5. usage_examples MUST be an array of OBJECTS (not strings!) with at least 2 examples. Each example object must have sentence_jp, sentence_romaji, sentence_vi, sentence_en fields
6. grammar_points MUST be an array with at least 2-3 items - DO NOT use null or empty array
7. Return ONLY valid JSON array, no markdown, no code blocks, no explanations, no other text before or after the JSON array
8. Do NOT include null values - if a field is optional and not applicable, use appropriate default (empty object {} for conjugation_rules, empty array [] is NOT allowed for usage_examples and grammar_points)
9. Every pattern MUST be complete with all fields filled
10. Ensure JSON is valid and complete - do not truncate or cut off the response mid-JSON`;
};

export const GRAMMAR_PATTERN_RETRY_PROMPT = (basePrompt: string, count: number): string => {
  return `${basePrompt}\n\nCRITICAL: Previous response had JSON parsing errors. Please ensure:
1. Return EXACTLY ${count} patterns in the JSON array (not more, not less)
2. Return ONLY valid JSON array (no markdown, no code blocks, no extra text)
3. EVERY pattern MUST have pattern_jp as a non-empty string
4. EVERY pattern MUST have pattern_romaji as a non-empty string - DO NOT use null or omit this field
5. EVERY pattern MUST have explanation object with vi, en, jp (all non-empty strings)
6. EVERY pattern MUST have usage_examples as an array of OBJECTS (not strings!) with at least 2 examples. Each example object must have: sentence_jp, sentence_romaji, sentence_vi, sentence_en
7. EVERY pattern MUST have grammar_points array with at least 2-3 items - DO NOT use null or empty array
8. Do NOT include null values - fill all fields properly
9. Ensure JSON is complete and valid - do not truncate the response mid-JSON`;
};

