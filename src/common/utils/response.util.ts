import { ApiResponse } from '@interfaces/api-response.interface';

export class ResponseUtil {
  static success<T>(
    data: T,
    message = 'Request successful',
    statusCode = 200,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      errors: null,
      statusCode,
    };
  }

  static error(
    message = 'Request failed',
    errors: unknown = null,
    statusCode = 500,
  ): ApiResponse<null> {
    return {
      success: false,
      message,
      data: null,
      errors,
      statusCode,
    };
  }

  static created<T>(
    data: T,
    message = 'Resource created successfully',
  ): ApiResponse<T> {
    return this.success(data, message, 201);
  }

  static updated<T>(
    data: T,
    message = 'Resource updated successfully',
  ): ApiResponse<T> {
    return this.success(data, message, 200);
  }

  static deleted(message = 'Resource deleted successfully'): ApiResponse<null> {
    return this.success(null, message, 200);
  }

  static notFound(message = 'Resource not found'): ApiResponse<null> {
    return this.error(message, { error: 'Not Found' }, 404);
  }

  static unauthorized(message = 'Unauthorized'): ApiResponse<null> {
    return this.error(message, { error: 'Unauthorized' }, 401);
  }

  static forbidden(message = 'Forbidden'): ApiResponse<null> {
    return this.error(message, { error: 'Forbidden' }, 403);
  }

  static badRequest(
    message = 'Bad Request',
    errors: unknown = null,
  ): ApiResponse<null> {
    return this.error(message, errors ?? { error: 'Bad Request' }, 400);
  }

  static conflict(message = 'Conflict'): ApiResponse<null> {
    return this.error(message, { error: 'Conflict' }, 409);
  }

  static validationError(
    validationErrors: string[],
    message = 'Validation failed',
  ): ApiResponse<null> {
    return this.error(
      message,
      {
        validation: validationErrors,
        error: 'Bad Request',
        statusCode: 400,
      },
      400,
    );
  }
}
