import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '@interfaces/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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
      // Handle JSON parsing errors from request body
      if (exception.name === 'SyntaxError' && exception.message.includes('JSON')) {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid JSON format in request body';
        
        // Log request body for debugging (first 500 chars to avoid logging sensitive data)
        const bodyPreview = request.body 
          ? JSON.stringify(request.body).substring(0, 500)
          : 'Request body is empty or not parsed';
        
        this.logger.warn(
          `JSON parsing error: ${exception.message}. Request body preview: ${bodyPreview}`,
        );

        // Try to provide helpful suggestions based on common errors
        let suggestion = 'Please check your JSON syntax (missing commas, quotes, or brackets)';
        if (exception.message.includes('Unexpected token')) {
          const tokenMatch = exception.message.match(/Unexpected token '([^']+)'/);
          if (tokenMatch) {
            const token = tokenMatch[1];
            suggestion = `Unexpected token '${token}' found. Check for: unescaped quotes, missing commas, or invalid characters in strings.`;
          }
        } else if (exception.message.includes('Unexpected end')) {
          suggestion = 'JSON appears to be incomplete. Check for missing closing brackets or braces.';
        } else if (exception.message.includes('Expected')) {
          suggestion = 'JSON structure is invalid. Check for missing commas, colons, or brackets.';
        }

        errors = {
          name: exception.name,
          message: exception.message,
          suggestion,
          hint: 'Make sure your JSON is properly formatted. You can use a JSON validator tool to check your syntax.',
        };
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = exception.message || 'Internal server error';
        errors = {
          name: exception.name,
          message: exception.message,
          stack:
            process.env.NODE_ENV === 'development' ? exception.stack : undefined,
        };
      }
    } else {
      message = 'Unknown error occurred';
      errors = { error: 'Unknown error' };
    }

    // Log error for debugging
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
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
