/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { OutputDto } from './dto';

export function throwHttpErr(errorData: OutputDto<any>) {
  throw new HttpException(
    errorData?.error || errorData?.message || 'err_service_Failed',
    errorData?.code || HttpStatus.FAILED_DEPENDENCY,
  );
}

export function handleSrvCliResponse(data: OutputDto<any>) {
  if (data?.status != 'SUCCEED') throwHttpErr(data);
  return data.data;
}
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const errorRes: any = exception.getResponse();

    let errorMessage = 'Internal server error';
    let errorDescription: any = null;

    if (typeof errorRes === 'string') {
      errorMessage = errorRes;
      errorDescription = errorRes;
    } else if (typeof errorRes === 'object') {
      errorMessage = errorRes.error || errorRes.message || exception.name;
      errorDescription = errorRes.error || errorRes.message;
    } else {
      errorMessage = exception.message;
    }

    response.status(exception.getStatus()).send({
      code: exception.getStatus(),
      status: 'FAILED',
      message: errorMessage,
      error: Array.isArray(errorDescription)
        ? errorDescription
        : [errorDescription],
      data: errorRes?.data || null,
    });
  }
}
