/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { PostgresService } from 'src/database/postgres.service';
import { SrvError } from 'src/response/dto';
import { UtilsService } from 'src/utils/utils.service';
import { Request } from 'express';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly pg: PostgresService,
    private readonly utils: UtilsService,
  ) {}
  async register(dto: RegisterDto, req: Request) {
    const userAgent = (req as any).clientUserAgent;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    if (!this.utils.PasswordHandler.isStrongPassword(dto.password)) {
      throw new SrvError(
        HttpStatus.BAD_REQUEST,
        'Password must be strong (A-z, 0-9, symbol)',
      );
    }

    const exists = await this.pg.models.User.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new SrvError(HttpStatus.BAD_REQUEST, 'Email already exists');
    }

    const hashedPassword = await this.utils.PasswordHandler.hashPassword(
      dto.password,
    );
    const user = await this.pg.models.User.create({
      email: dto.email,
      password: hashedPassword,
      role: 'USER',
    });

    const deviceFingerprint = this.utils.Fingerprint.buildDeviceFingerprint({
      userAgent,
      ip,
    });

    const sessionRecord = await this.pg.models.Session.create({
      userId: user.id,
      deviceFingerprint,
      userAgent,
      lastActiveAt: new Date(),
      isActive: true,
    });

    const userType = 'USER';
    const tokenObj = new this.utils.JwtHandler.AccessToken(
      String(user.id),
      userType,
    );
    const tokenData = tokenObj.generate(String(sessionRecord.id));
    if (!tokenData) {
      throw new SrvError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to generate token',
      );
    }
    return {
      message: 'User registered and logged in successfully',
      accessToken: tokenData.token,
      expiresIn: tokenData.ttl,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
  async login(dto: LoginDto, req: Request) {
    const user = await this.pg.models.User.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new SrvError(HttpStatus.BAD_REQUEST, 'Invalid credentials');
    }

    const valid = await this.utils.PasswordHandler.comparePassword(
      dto.password,
      user.password,
    );
    if (!valid) {
      throw new SrvError(HttpStatus.BAD_REQUEST, 'Invalid credentials');
    }

    const userAgent = (req as any).clientUserAgent || req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    const deviceFingerprint = this.utils.Fingerprint.buildDeviceFingerprint({
      userAgent,
      ip,
    });

    const activeSessions = await this.pg.models.Session.findAll({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    const existingSession = activeSessions.find(
      (s) => s.deviceFingerprint === deviceFingerprint,
    );

    let sessionRecord: any;

    if (existingSession) {
      await existingSession.update({
        lastActiveAt: new Date(),
        userAgent,
      });

      sessionRecord = existingSession;

      return {
        message: 'شما قبلاً وارد شده‌اید و سشن شما تمدید شد.',
        accessToken: null,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } else {
      if (activeSessions.length >= 3) {
        throw new SrvError(
          HttpStatus.FORBIDDEN,
          'شما قبلاً از ۳ دستگاه مختلف وارد شده‌اید. امکان لاگین از دستگاه جدید وجود ندارد.',
        );
      }

      sessionRecord = await this.pg.models.Session.create({
        userId: user.id,
        deviceFingerprint,
        userAgent,
        lastActiveAt: new Date(),
        isActive: true,
      });

      const userType = user.role;
      const tokenObj = new this.utils.JwtHandler.AccessToken(
        String(user.id),
        userType,
      );
      const tokenData = tokenObj.generate(String(sessionRecord.id));

      if (!tokenData) {
        throw new SrvError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Failed to generate token',
        );
      }

      return {
        message: 'Login successful',
        accessToken: tokenData.token,
        expiresIn: tokenData.ttl,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    }
  }
}
