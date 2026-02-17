/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { PostgresService } from 'src/database/postgres.service';
import { SrvError } from 'src/response/dto';
import { UtilsService } from 'src/utils/utils.service';
import { RegisterDto } from './dto/register.dto';
import { Op } from 'sequelize';
import { UserRole } from 'src/database/models/User.model';

const MAX_ACTIVE_SESSIONS = 3;
const SESSION_TTL_DAYS = 30;

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly pg: PostgresService,
    private readonly utils: UtilsService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.pg.models.User.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new SrvError(HttpStatus.BAD_REQUEST, 'Email already exists');
    }
    if (!this.utils.PasswordHandler.isStrongPassword(dto.password)) {
      throw new SrvError(
        HttpStatus.BAD_REQUEST,
        'Password must be strong (A-z, 0-9, symbol)',
      );
    }

    const hashedPassword = await this.utils.PasswordHandler.hashPassword(
      dto.password,
    );

    const user = await this.pg.models.User.create({
      email: dto.email,
      password: hashedPassword,
      role: 'USER',
    });

    const sessionRecord = await this.pg.models.Session.create({
      userId: user.id,
      deviceId: dto.deviceId,
      lastActiveAt: new Date(),
      revokedAt: null,
      expiresAt: addDays(SESSION_TTL_DAYS),
    });

    const tokenObj = new this.utils.JwtHandler.AccessToken(
      String(user.id),
      user.role,
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

  async login(dto: LoginDto) {
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

    const isUser = user.role === UserRole.USER;
    const isAdmin = user.role === UserRole.ADMIN;

    if (isUser && !dto.deviceId) {
      throw new SrvError(HttpStatus.BAD_REQUEST, 'deviceId is required');
    }

    const deviceIdToUse = dto.deviceId ?? (isAdmin ? 'admin-web' : undefined);
    if (!deviceIdToUse) {
      throw new SrvError(HttpStatus.BAD_REQUEST, 'deviceId is required');
    }

    const activeWhere = {
      userId: user.id,
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    };

    const existingSession = await this.pg.models.Session.findOne({
      where: {
        ...activeWhere,
        deviceId: deviceIdToUse,
      },
    });

    let sessionRecord: any;
    let message = 'Login successful';

    if (existingSession) {
      await existingSession.update({
        lastActiveAt: new Date(),
        expiresAt: addDays(SESSION_TTL_DAYS),
      });
      sessionRecord = existingSession;
      message = 'شما قبلاً وارد شده‌اید و سشن شما تمدید شد.';
    } else {
      if (isUser) {
        const activeCount = await this.pg.models.Session.count({
          where: activeWhere,
        });

        if (activeCount >= MAX_ACTIVE_SESSIONS) {
          throw new SrvError(
            HttpStatus.FORBIDDEN,
            'شما قبلاً از ۳ دستگاه مختلف وارد شده‌اید. امکان لاگین از دستگاه جدید وجود ندارد.',
          );
        }
      }

      sessionRecord = await this.pg.models.Session.create({
        userId: user.id,
        deviceId: deviceIdToUse,
        lastActiveAt: new Date(),
        revokedAt: null,
        expiresAt: addDays(SESSION_TTL_DAYS),
      });
    }

    const tokenObj = new this.utils.JwtHandler.AccessToken(
      String(user.id),
      user.role,
    );
    const tokenData = tokenObj.generate(String(sessionRecord.id));

    if (!tokenData) {
      throw new SrvError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to generate token',
      );
    }

    return {
      message,
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
