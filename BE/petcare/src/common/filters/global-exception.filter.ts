import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';

interface ErrorResponse {
  status: number;
  message: string;
  error?: any;
  stack?: any;
  url?: any;
}

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
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
      errorResponse.stack = exception.stack;
      errorResponse.url = request.url;
    }

    response.status(errorResponse.status).json(errorResponse);
  }
}
