import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EtagService {
  /**
   * Generate ETag from entity data
   * Uses hash of entity data + updated_at timestamp
   */
  generateETag(entity: any, updatedAt?: Date): string {
    const dataString = JSON.stringify(entity);
    const timestamp = updatedAt ? updatedAt.toISOString() : new Date().toISOString();
    const combined = `${dataString}-${timestamp}`;
    
    // Use SHA256 hash (first 16 chars for shorter ETag)
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    return hash.substring(0, 16);
  }
  
  /**
   * Validate ETag format
   */
  validateETag(etag: string): boolean {
    return typeof etag === 'string' && etag.length > 0;
  }
}

