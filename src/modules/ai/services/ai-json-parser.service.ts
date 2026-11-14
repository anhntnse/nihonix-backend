import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RetryNeededException } from '../exceptions/retry-needed.exception';

export interface ParseJsonOptions {
  expectedCount?: number;
  allowRepair?: boolean;
  arrayType?: 'array' | 'object';
}

@Injectable()
export class AiJsonParserService {
  private readonly logger = new Logger(AiJsonParserService.name);

  /**
   * Parse JSON from AI response content
   * Handles code blocks, truncated JSON, and validation
   */
  parseJson<T = any>(content: string, options: ParseJsonOptions = {}): T {
    const { expectedCount, allowRepair = true, arrayType = 'array' } = options;

    let jsonContent = content.trim();

    // Extract JSON from code blocks
    const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    }

    // Extract JSON array or object
    const jsonMatch =
      arrayType === 'array'
        ? jsonContent.match(/\[[\s\S]*\]/)
        : jsonContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      this.logger.warn(`No JSON ${arrayType} found in response. Content: ${jsonContent.substring(0, 200)}`);
      throw new RetryNeededException(`No JSON ${arrayType} found in AI response`);
    }

    let jsonString = jsonMatch[0];

    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate array count if expectedCount is provided
      if (arrayType === 'array' && expectedCount !== undefined) {
        if (!Array.isArray(parsed)) {
          throw new RetryNeededException(`Expected JSON array but got ${typeof parsed}`);
        }
        if (parsed.length !== expectedCount) {
          throw new RetryNeededException(`Pattern count mismatch: Expected ${expectedCount}, got ${parsed.length}`);
        }
      }

      this.logger.debug(`Successfully parsed JSON ${arrayType === 'array' ? `(${Array.isArray(parsed) ? parsed.length : 'N/A'} items)` : ''}`);
      return parsed as T;
    } catch (parseError: any) {
      // If it's already a RetryNeededException, rethrow it
      if (parseError instanceof RetryNeededException) {
        throw parseError;
      }

      // Try to repair truncated JSON
      if (allowRepair && parseError.message.includes('JSON')) {
        const repairedJson = this.tryRepairJson(jsonString);
        if (repairedJson) {
          try {
            const parsed = JSON.parse(repairedJson);
            
            // Validate after repair
            if (arrayType === 'array' && expectedCount !== undefined) {
              if (!Array.isArray(parsed) || parsed.length !== expectedCount) {
                throw new RetryNeededException(
                  `Repaired JSON count mismatch: Expected ${expectedCount}, got ${Array.isArray(parsed) ? parsed.length : 'N/A'}`,
                );
              }
            }
            
            this.logger.warn(`Successfully repaired truncated JSON`);
            return parsed as T;
          } catch (repairError: any) {
            // Repair failed, throw RETRY_NEEDED
            if (repairError instanceof RetryNeededException) {
              throw repairError;
            }
            throw new RetryNeededException(`JSON repair failed: ${repairError.message}`);
          }
        }
      }

      // If it's a JSON parse error, throw RETRY_NEEDED
      if (parseError.message.includes('JSON') || parseError instanceof SyntaxError) {
        this.logger.error(`JSON parsing failed. Content length: ${jsonString.length}, Error: ${parseError.message}`);
        this.logger.debug(`JSON content (first 1000 chars): ${jsonString.substring(0, 1000)}`);
        this.logger.debug(`JSON content (last 500 chars): ${jsonString.substring(Math.max(0, jsonString.length - 500))}`);
        throw new RetryNeededException(`JSON parsing failed: ${parseError.message}`);
      }
      
      throw new BadRequestException(`Failed to parse JSON: ${parseError.message}`);
    }
  }

  /**
   * Try to repair truncated JSON by adding missing closing brackets/braces
   */
  private tryRepairJson(jsonString: string): string | null {
    try {
      let repaired = jsonString.trim();

      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;

      // Add missing closing braces
      let currentCloseBraces = closeBraces;
      while (openBraces > currentCloseBraces) {
        repaired += '}';
        currentCloseBraces++;
      }

      // Add missing closing brackets
      let currentCloseBrackets = closeBrackets;
      while (openBrackets > currentCloseBrackets) {
        repaired += ']';
        currentCloseBrackets++;
      }

      // Only return if braces and brackets are balanced
      if (openBraces === currentCloseBraces && openBrackets === currentCloseBrackets) {
        return repaired;
      }
    } catch {
      return null;
    }
    return null;
  }
}

