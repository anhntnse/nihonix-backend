import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeSession } from './entity/practice-session.entity';
import { PracticeExercise } from './entity/practice-exercise.entity';
import { Topic } from '@topics/entity/topic.entity';
import { VocabularyItem } from '@vocabulary-items/entity/vocabulary-item.entity';
import { GrammarPattern } from '@grammar-patterns/entity/grammar-pattern.entity';
import { GenerateFillBlankDto, GenerateMultipleChoiceDto, SubmitPracticeDto } from './dto';
import { AiGenerationService } from '@ai/services/ai-generation.service';
import { AiJsonParserService } from '@ai/services/ai-json-parser.service';
import { RetryNeededException } from '@ai/exceptions/retry-needed.exception';

@Injectable()
export class PracticeService {
  private readonly logger = new Logger(PracticeService.name);

  constructor(
    @InjectRepository(PracticeSession)
    private practiceSessionRepository: Repository<PracticeSession>,
    @InjectRepository(PracticeExercise)
    private practiceExerciseRepository: Repository<PracticeExercise>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(VocabularyItem)
    private vocabularyItemRepository: Repository<VocabularyItem>,
    @InjectRepository(GrammarPattern)
    private grammarPatternRepository: Repository<GrammarPattern>,
    private aiGenerationService: AiGenerationService,
    private aiJsonParserService: AiJsonParserService,
  ) {}

  async generateFillBlank(dto: GenerateFillBlankDto, userId: string): Promise<any> {
    return this.generatePracticeByType(dto.topic_id, 'fill_blank', dto.exercise_count || 10, userId);
  }

  async generateMultipleChoice(dto: GenerateMultipleChoiceDto, userId: string): Promise<any> {
    return this.generatePracticeByType(dto.topic_id, 'multiple_choice', dto.exercise_count || 10, userId);
  }

  private async generatePracticeByType(
    topicId: string,
    exerciseType: 'fill_blank' | 'multiple_choice',
    exerciseCount: number,
    userId: string,
  ): Promise<any> {
    try {
      this.logger.log(`Generating ${exerciseType} practice for topic: ${topicId}, count: ${exerciseCount}`);

      // 1. Get topic
      const topic = await this.topicRepository.findOne({
        where: { id: topicId },
        relations: ['level'],
      });

      if (!topic) {
        throw new NotFoundException(`Topic with id ${topicId} not found`);
      }

      // 2. Get vocabulary items
      const vocabularyItems = await this.vocabularyItemRepository.find({
        where: { topic_id: topicId },
        order: { order: 'ASC' },
      });

      if (vocabularyItems.length === 0) {
        throw new BadRequestException('No vocabulary items found for this topic');
      }

      // 3. Get grammar patterns (via topic slug)
      const grammarPatterns = await this.grammarPatternRepository.find({
        where: { topic_slug: topic.slug },
      });

      if (grammarPatterns.length === 0) {
        throw new BadRequestException('No grammar patterns found for this topic');
      }

      // 4. Build AI prompt
      const prompt = this.buildPracticePromptByType(
        topic,
        vocabularyItems,
        grammarPatterns,
        exerciseType,
        exerciseCount,
      );

      // 5. Generate exercises with AI
      const maxRetries = 3;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.aiGenerationService.generateWithRetry({
            prompt,
            expectedCount: 1,
            tokensPerItem: 500 * exerciseCount,
            maxRetries: 0,
          });

          const result = this.aiJsonParserService.parseJson<any>(response.content, {
            expectedCount: 1,
            allowRepair: true,
            arrayType: 'object',
          });

          if (!result.exercises || !Array.isArray(result.exercises)) {
            throw new RetryNeededException('AI response missing exercises array');
          }

          const validExercises = this.validateExercises(result.exercises);
          if (validExercises.length === 0) {
            throw new RetryNeededException('All exercises are invalid');
          }

          // 6. Create practice session
          const session = await this.createPracticeSession(
            userId,
            topicId,
            topic.level_code,
            validExercises.length,
            exerciseType,
          );

          // 7. Save exercises
          const savedExercises = await this.saveExercises(session.id, validExercises);

          return {
            session_id: session.id,
            topic_id: topicId,
            topic_title: topic.title,
            level_code: topic.level_code,
            exercise_type: exerciseType,
            total_exercises: savedExercises.length,
            vocabulary_count: vocabularyItems.length,
            grammar_count: grammarPatterns.length,
            exercises: savedExercises.map((ex, index) => ({
              id: ex.id,
              type: ex.type,
              question: ex.question,
              options: ex.options,
              explanation: ex.explanation,
              order: index + 1,
            })),
            estimated_time: Math.ceil(savedExercises.length * 1.5), // minutes
            created_at: session.created_at,
          };
        } catch (error: any) {
          if (error instanceof RetryNeededException && attempt < maxRetries) {
            this.logger.warn(`Retrying practice generation (attempt ${attempt + 2}/${maxRetries + 1})...`);
            continue;
          }
          if (attempt === maxRetries) {
            this.logger.error(`Failed to generate practice after ${maxRetries + 1} attempts`, error.stack);
            throw new BadRequestException(
              `Failed to generate practice exercises after ${maxRetries + 1} attempts. Please try again.`,
            );
          }
          throw error;
        }
      }

      throw new BadRequestException('Failed to generate practice exercises');
    } catch (error: any) {
      this.logger.error(`Practice generation error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPracticeSets(
    userId: string,
    topicId?: string,
    exerciseType?: 'fill_blank' | 'multiple_choice',
    status?: 'in_progress' | 'completed',
  ): Promise<any> {
    const where: any = { user_id: userId };
    if (topicId) where.topic_id = topicId;
    if (exerciseType) where.exercise_type = exerciseType;
    if (status) where.status = status;

    const sessions = await this.practiceSessionRepository.find({
      where,
      relations: ['topic'],
      order: { created_at: 'DESC' },
    });

    return sessions.map((session) => ({
      id: session.id,
      topic_id: session.topic_id,
      topic_title: session.topic.title,
      level_code: session.level_code,
      exercise_type: session.exercise_type,
      total_exercises: session.total_exercises,
      correct_count: session.correct_count,
      accuracy: session.accuracy ? Math.round(Number(session.accuracy)) : null,
      total_time: session.total_time,
      status: session.status,
      completed_at: session.completed_at,
      created_at: session.created_at,
    }));
  }

  async getPracticeSetById(sessionId: string, userId: string): Promise<any> {
    const session = await this.practiceSessionRepository.findOne({
      where: { id: sessionId, user_id: userId },
      relations: ['topic', 'exercises'],
    });

    if (!session) {
      throw new NotFoundException('Practice set not found');
    }

    // Sort exercises by order_index
    const sortedExercises = session.exercises.sort((a, b) => a.order_index - b.order_index);

    return {
      id: session.id,
      topic_id: session.topic_id,
      topic_title: session.topic.title,
      level_code: session.level_code,
      exercise_type: session.exercise_type,
      total_exercises: session.total_exercises,
      correct_count: session.correct_count,
      accuracy: session.accuracy ? Math.round(Number(session.accuracy)) : null,
      total_time: session.total_time,
      status: session.status,
      completed_at: session.completed_at,
      created_at: session.created_at,
      exercises: sortedExercises.map((ex) => ({
        id: ex.id,
        type: ex.type,
        question: ex.question,
        options: ex.options,
        correct_answer: ex.correct_answer,
        explanation: ex.explanation,
        vocabulary_tested: ex.vocabulary_tested,
        grammar_tested: ex.grammar_tested,
        user_answer: ex.user_answer,
        is_correct: ex.is_correct,
        time_spent: ex.time_spent,
        order: ex.order_index,
      })),
    };
  }

  async submitPractice(dto: SubmitPracticeDto, userId: string): Promise<any> {
    const session = await this.practiceSessionRepository.findOne({
      where: { id: dto.session_id, user_id: userId },
      relations: ['exercises', 'topic'],
    });

    if (!session) {
      throw new NotFoundException('Practice session not found');
    }

    if (session.status === 'completed') {
      throw new BadRequestException('Practice session already completed');
    }

    let correctCount = 0;
    let totalTime = 0;
    const results: any[] = [];

    for (const answer of dto.answers) {
      const exercise = session.exercises.find((ex) => ex.id === answer.exercise_id);
      if (!exercise) continue;

      const isCorrect = this.checkAnswer(exercise, answer.user_answer);
      if (isCorrect) correctCount++;

      exercise.user_answer = answer.user_answer;
      exercise.is_correct = isCorrect;
      exercise.time_spent = answer.time_spent || 0;
      totalTime += exercise.time_spent;

      await this.practiceExerciseRepository.save(exercise);

      results.push({
        exercise_id: exercise.id,
        is_correct: isCorrect,
        user_answer: answer.user_answer,
        correct_answer: exercise.correct_answer,
        explanation: exercise.explanation,
      });
    }

    const accuracy = (correctCount / session.total_exercises) * 100;

    session.correct_count = correctCount;
    session.accuracy = accuracy;
    session.total_time = totalTime;
    session.status = 'completed';
    session.completed_at = new Date();

    await this.practiceSessionRepository.save(session);

    return {
      session_id: session.id,
      topic_title: session.topic.title,
      total_exercises: session.total_exercises,
      correct_count: correctCount,
      accuracy: Math.round(accuracy),
      total_time: totalTime,
      results,
    };
  }

  private async createPracticeSession(
    userId: string,
    topicId: string,
    levelCode: string,
    totalExercises: number,
    exerciseType: 'fill_blank' | 'multiple_choice',
  ): Promise<PracticeSession> {
    const session = this.practiceSessionRepository.create({
      user_id: userId,
      topic_id: topicId,
      level_code: levelCode,
      total_exercises: totalExercises,
      exercise_type: exerciseType,
      status: 'in_progress',
    });

    return this.practiceSessionRepository.save(session);
  }

  private async saveExercises(sessionId: string, exercises: any[]): Promise<PracticeExercise[]> {
    const savedExercises: PracticeExercise[] = [];

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const exercise = this.practiceExerciseRepository.create({
        session_id: sessionId,
        type: ex.type,
        question: ex.question,
        options: ex.options || null,
        correct_answer: ex.correct_answer,
        explanation: ex.explanation,
        vocabulary_tested: ex.vocabulary_tested || null,
        grammar_tested: ex.grammar_tested || null,
        order_index: i + 1,
      });

      const saved = await this.practiceExerciseRepository.save(exercise);
      savedExercises.push(saved);
    }

    return savedExercises;
  }

  private validateExercises(exercises: any[]): any[] {
    const validExercises: any[] = [];

    for (const ex of exercises) {
      if (
        !ex.type ||
        !ex.question ||
        !ex.question.text ||
        !ex.correct_answer ||
        !ex.explanation ||
        !ex.explanation.vi ||
        !ex.explanation.en
      ) {
        this.logger.warn('Skipping invalid exercise', JSON.stringify(ex, null, 2));
        continue;
      }

      validExercises.push(ex);
    }

    return validExercises;
  }

  private checkAnswer(exercise: PracticeExercise, userAnswer: any): boolean {
    const correctAnswer = exercise.correct_answer;

    if (exercise.type === 'multiple_choice' || exercise.type === 'fill_blank') {
      return userAnswer === correctAnswer;
    }

    if (exercise.type === 'translation') {
      if (Array.isArray(correctAnswer)) {
        return correctAnswer.some((ans: string) =>
          ans.toLowerCase().trim() === String(userAnswer).toLowerCase().trim(),
        );
      }
      return String(correctAnswer).toLowerCase().trim() === String(userAnswer).toLowerCase().trim();
    }

    if (exercise.type === 'sentence_order') {
      return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    }

    return false;
  }

  private buildPracticePromptByType(
    topic: Topic,
    vocabularyItems: VocabularyItem[],
    grammarPatterns: GrammarPattern[],
    exerciseType: 'fill_blank' | 'multiple_choice',
    exerciseCount: number,
  ): string {
    const typeDescription = exerciseType === 'fill_blank' 
      ? 'Fill in the blank (4 options)' 
      : 'Choose correct answer (4 options)';

    return `You are a Japanese language learning assistant. Generate practice exercises combining vocabulary and grammar.

TOPIC: "${topic.title.en}" (${topic.level_code})

VOCABULARY AVAILABLE (${vocabularyItems.length} items):
${vocabularyItems.slice(0, 20).map(v => `- ${v.romaji} (${v.kanji || v.kana}): ${v.meaning.en}`).join('\n')}

GRAMMAR PATTERNS AVAILABLE (${grammarPatterns.length} patterns):
${grammarPatterns.slice(0, 10).map(g => `- ${g.pattern_jp} (${g.pattern_romaji || ''}): ${g.explanation.en}`).join('\n')}

REQUIREMENTS:
- Generate exactly ${exerciseCount} exercises
- Exercise type: ${exerciseType} (${typeDescription})
- Use ONLY vocabulary and grammar from the lists above
- Ensure exercises are contextually relevant
- Provide clear explanations in Vietnamese and English
- All exercises MUST be type: "${exerciseType}"

OUTPUT FORMAT (JSON):
{
  "exercises": [
    {
      "type": "${exerciseType}",
      "question": {
        "text": "おはよう____。",
        "hint": "Morning greeting",
        "context": "Greeting someone in the morning"
      },
      "options": [
        { "id": 1, "text": "ございます" },
        { "id": 2, "text": "です" },
        { "id": 3, "text": "ました" },
        { "id": 4, "text": "ません" }
      ],
      "correct_answer": 1,
      "explanation": {
        "vi": "おはようございます là lời chào buổi sáng lịch sự",
        "en": "おはようございます is a polite morning greeting"
      },
      "vocabulary_tested": ["ohayou"],
      "grammar_tested": ["gozaimasu"]
    }
  ]
}

IMPORTANT:
- ONLY use vocabulary and grammar from the provided lists
- Ensure all exercises are appropriate for ${topic.level_code} level
- ALL exercises must have type: "${exerciseType}"
- Return ONLY valid JSON, no other text

RETURN ONLY THE JSON OBJECT - NO OTHER TEXT!`;
  }
}

