import {INestApplication} from '@nestjs/common';
import {json,urlencoded} from 'express';
/** Only flashcard bulk requests need the larger bounded JSON body. */
export function configureFlashcardBodies(app:INestApplication) {
  app.use('/api/flashcards',json({limit:'8mb'}));
  // Nest detects a named JSON parser even when it is mounted on one path; register the default explicitly too.
  app.use(json({limit:'100kb'}));
  app.use(urlencoded({extended:true,limit:'100kb'}));
}
