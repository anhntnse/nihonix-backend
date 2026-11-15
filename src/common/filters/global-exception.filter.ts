import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { requestId } from '../request-id';
import { ApiResponse } from '@interfaces/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = requestId(response);
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown = null;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          (responseObj.message as string) ||
          (responseObj.error as string) ||
          'Request failed';
        errors = responseObj;

        // Handle validation errors
        if (Array.isArray(responseObj.message)) {
          message = 'Validation failed';
          errors = {
            validation: responseObj.message,
            error: responseObj.error,
            statusCode: status,
          };
        }
      }
    } else if (exception instanceof Error) {
      const invalidJson = exception.name === 'SyntaxError';
      const tooLarge = (exception as Error & { type?: string }).type === 'entity.too.large';
      status = tooLarge ? HttpStatus.PAYLOAD_TOO_LARGE : invalidJson ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
      message = tooLarge ? 'Request body exceeds the allowed size' : invalidJson ? 'Invalid JSON format in request body' : 'Internal server error';
      errors = null;
    } else {
      message = 'Unknown error occurred';
      errors = { error: 'Unknown error' };
    }

    // Log error for debugging
    this.logger.error(
      `[${correlationId}] ${request.method} ${request.path} - ${status} - ${message}`,
      exception instanceof Error ? exception.name : 'Unknown error',
    );

    const errorResponse: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      errors,
      statusCode: status,
    };

    response.status(status).json(errorResponse);
  }
}
