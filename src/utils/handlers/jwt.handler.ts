import JWT from 'jsonwebtoken';
import config from 'config';
import { UserRole } from 'src/database/models/User.model';

const jwtOptions: any = config.get('jwt');
const projectName: any = config.get('server.name');

const getTokenName = (tokenName: string, userType: 'ADMIN' | 'USER') => {
  return `${projectName.toLowerCase()}_${tokenName.toLowerCase()}_${userType.toLowerCase()}`;
};

export const enum JwtTypeEnum {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

export type AccessPayloadType = {
  userType: 'ADMIN' | 'USER';
  accountId: string;
  sessionId: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
};

type AccessWrappedPayloadType = {
  ut: 'ADMIN' | 'USER';
  aid: string;
  sid: string;
  aea: number;
  rea: number;
};

export enum TokenAvailabilityTypeEnum {
  AVAILABLE = 'AVAILABLE',
  EXPIRED = 'EXPIRED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export function generateToken(
  type: JwtTypeEnum,
  payload: object,
): { token: string; ttl: number } {
  const opts = jwtOptions[type];
  if (!opts) {
    throw new Error(`JWT config not found for type: ${type}`);
  }
  try {
    const token = JWT.sign(payload, opts.secret, {
      expiresIn: opts.expiresInSeconds,
    });
    return {
      token,
      ttl: opts.expiresInSeconds * 1000,
    };
  } catch (err: any) {
    throw new Error(`Failed to generate JWT: ${err?.message ?? err}`);
  }
}

export function decodeToken(token: string) {
  const decoded = JWT.decode(token, { complete: true });
  if (!decoded || !decoded.payload) {
    throw new Error('Invalid JWT decode result');
  }
  return decoded.payload;
}

export function verifyToken(token: string, type: JwtTypeEnum) {
  try {
    const secret = jwtOptions[type].secret;
    const verified = JWT.verify(token, secret, { complete: true });
    return verified?.payload ?? null;
  } catch (e) {
    return null;
  }
}

export class AccessToken {
  public accountId: string;
  public userType: 'ADMIN' | 'USER';
  private date: Date;
  private accessOptions: {
    expiresInSeconds: number;
    secret: string;
  } = jwtOptions.access;
  private refreshOptions: {
    expiresInSeconds: number;
    secret: string;
  } = jwtOptions.refresh;
  private accessExpiresAt: number;
  private refreshExpiresAt: number;
  private ttl: number;

  constructor(accountId: string, userType: 'ADMIN' | 'USER') {
    this.userType = userType;
    this.accountId = accountId;
    this.date = new Date();
    this.accessExpiresAt =
      +this.date + +this.accessOptions.expiresInSeconds * 1000;
    this.refreshExpiresAt =
      +this.date + +this.refreshOptions.expiresInSeconds * 1000;
    this.ttl = +this.refreshOptions.expiresInSeconds * 1000;
  }

  generate(sessionId: string) {
    if (!sessionId) return null;

    const payload: AccessWrappedPayloadType = {
      ut: this.userType,
      aid: this.accountId,
      sid: sessionId,
      aea: this.accessExpiresAt,
      rea: this.refreshExpiresAt,
    };

    const generated = generateToken(JwtTypeEnum.ACCESS, payload);

    return {
      name: getTokenName(`auth`, this.userType),
      ttl: generated.ttl,
      token: generated.token,
      payload: AccessToken.payloadWrapper(payload),
    };
  }

  static payloadWrapper(payload: AccessWrappedPayloadType): AccessPayloadType {
    return {
      userType: payload.ut,
      accountId: payload.aid,
      sessionId: payload.sid,
      accessExpiresAt: payload.aea,
      refreshExpiresAt: payload.rea,
    };
  }

  static decode(token: string): AccessPayloadType {
    const decoded: any = decodeToken(token);
    return AccessToken.payloadWrapper(decoded);
  }

  static checkExpiry(token: string): TokenAvailabilityTypeEnum {
    try {
      const decoded = this.decode(token);
      if (!decoded) return TokenAvailabilityTypeEnum.UNAVAILABLE;

      const now = +new Date();

      if (decoded.accessExpiresAt > now)
        return TokenAvailabilityTypeEnum.AVAILABLE;

      if (decoded.accessExpiresAt < now && decoded.refreshExpiresAt > now)
        return TokenAvailabilityTypeEnum.EXPIRED;

      return TokenAvailabilityTypeEnum.UNAVAILABLE;
    } catch (e) {
      return TokenAvailabilityTypeEnum.UNAVAILABLE;
    }
  }

  verify(token: string): AccessPayloadType | null {
    try {
      const verified: any = verifyToken(token, JwtTypeEnum.ACCESS);
      return verified ? AccessToken.payloadWrapper(verified) : null;
    } catch (e) {
      return e;
    }
  }

  static revoke(userType: UserRole) {
    return {
      name: getTokenName(`auth`, userType),
      ttl: 0,
    };
  }
}
