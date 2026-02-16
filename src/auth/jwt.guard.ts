import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AccessToken } from 'src/utils/handlers/jwt.handler';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('توکن ارسال نشده است');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = AccessToken.decode(token);

      (request as any).user = decoded;

      return true;
    } catch (e) {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
  }
}
