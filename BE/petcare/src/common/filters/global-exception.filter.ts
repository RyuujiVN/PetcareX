import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

type ErrorResponse = {
  status: number;
  message: string;
  error?: any;
  stack?: any;
  url?: any;
};

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception Handling');

  constructor(private readonly configService: ConfigService) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse: ErrorResponse = {
      status: httpStatus,
      message: message,
    };

    if (this.configService.get('NODE_ENV') !== 'production') {
      errorResponse.error = exception.response;
      errorResponse.stack = exception.stack;
      errorResponse.url = request.url;
    }

    this.logger.error(exception.response, exception.stack, exception?.context);

    response.status(errorResponse.status).json(errorResponse);
  }
}
