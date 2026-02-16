/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const clx = context.switchToHttp();
    const res = clx.getResponse();
    const req = clx.getRequest();
    return next.handle().pipe(
      map((data) => {
        if (req.method === 'POST' && req.statusCode === HttpStatus.CREATED)
          res.status(HttpStatus.OK);
        return {
          code: res.statusCode,
          status: 'SUCCEED',
          message: 'here you go',
          error: null,
          data,
        };
      }),
    );
  }
}
