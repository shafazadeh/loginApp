/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PostgresService } from 'src/database/postgres.service';
import { SrvError } from 'src/response/dto';
import { UtilsService } from 'src/utils/utils.service';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';

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
    const userAgent = (req as any).clientUserAgent;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

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

    const deviceFingerprint = this.utils.Fingerprint.buildDeviceFingerprint({
      userAgent,
      ip,
    });

    const activeSessions = await this.pg.models.Session.findAll({
      where: {
        userId: user.id,
        isActive: true,
      },
      order: [['lastActiveAt', 'ASC']],
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
    } else {
      if (activeSessions.length >= 3) {
        const oldestSession = activeSessions[0];
        await oldestSession.update({ isActive: false });
      }

      sessionRecord = await this.pg.models.Session.create({
        userId: user.id,
        deviceFingerprint,
        userAgent,
        lastActiveAt: new Date(),
        isActive: true,
      });
    }
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
