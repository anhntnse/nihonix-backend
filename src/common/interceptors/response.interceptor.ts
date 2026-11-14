import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { requestId } from '../request-id';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@interfaces/api-response.interface';
import { RESPONSE_MESSAGE_KEY } from '@decorators/response-message.decorator';

interface ResponseWithStatusCode {
  statusCode: number;
}

interface RequestWithMethod {
  method?: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context
      .switchToHttp()
      .getResponse<Response>();
    requestId(response);
    const request = context.switchToHttp().getRequest<RequestWithMethod>();

    return next.handle().pipe(
      map((data: unknown): ApiResponse<T> => {
        // Don't transform if data is already in our format
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<T>;
        }

        // Get custom message from decorator
        const customMessage = this.reflector.getAllAndOverride<string>(
          RESPONSE_MESSAGE_KEY,
          [context.getHandler(), context.getClass()],
        );

        const method = request.method?.toUpperCase() ?? 'GET';
        let message = customMessage || this.getDefaultMessage(method);

        // If data has a message property, use it (highest priority)
        if (data && typeof data === 'object' && 'message' in data) {
          const dataWithMessage = data as { message?: string };
          message = dataWithMessage.message ?? message;
          delete dataWithMessage.message;
        }

        return {
          success: true,
          message,
          data: (data as T) ?? null,
          errors: null,
          statusCode: response.statusCode,
        };
      }),
    );
  }

  private getDefaultMessage(method: string): string {
    switch (method) {
      case 'POST':
        return 'Tạo mới thành công';
      case 'PUT':
      case 'PATCH':
        return 'Cập nhật thành công';
      case 'DELETE':
        return 'Xóa thành công';
      case 'GET':
        return 'Lấy dữ liệu thành công';
      default:
        return 'Request thành công';
    }
  }
}
