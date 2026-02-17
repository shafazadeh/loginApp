import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AccessToken,
  TokenAvailabilityTypeEnum,
  AccessPayloadType,
} from 'src/utils/handlers/jwt.handler';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('توکن ارسال نشده است');
    }

    const [scheme, token] = authHeader.trim().split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('فرمت توکن صحیح نیست');
    }

    const verifier = new AccessToken('', 'USER');
    const verified = verifier.verify(token);

    if (!verified) {
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    const availability = AccessToken.checkExpiry(token);

    if (availability === TokenAvailabilityTypeEnum.UNAVAILABLE) {
      throw new UnauthorizedException('توکن نامعتبر یا منقضی شده است');
    }

    if (availability === TokenAvailabilityTypeEnum.EXPIRED) {
      throw new UnauthorizedException('توکن access منقضی شده است');
    }

    const payload: AccessPayloadType = verified;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (request as any).user = payload;

    return true;
  }
}
