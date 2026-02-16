import { HttpException, HttpStatus } from '@nestjs/common';

export class OutputDto<ContextDto> {
  context: ContextDto;
  status: 'SUCCEED' | 'FAILED' | null;
  code: number | null;
  message?: string | null;
  error?: string | null;
  data?: any;
}

export class SrvError extends HttpException {
  constructor(status: HttpStatus, message: string) {
    super(
      {
        statusCode: status,
        message,
      },
      status,
    );
  }
}
