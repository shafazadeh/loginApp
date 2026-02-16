import { HttpStatus } from '@nestjs/common';

export class OutputDto<ContextDto> {
  context: ContextDto;
  status: 'SUCCEED' | 'FAILED' | null;
  code: number | null;
  message?: string | null;
  error?: string | null;
  data?: any;
}
export class SrvError extends Error {
  readonly code: HttpStatus;
  constructor(
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    error: string,
  ) {
    super(error);
    this.code = status;
  }
}
