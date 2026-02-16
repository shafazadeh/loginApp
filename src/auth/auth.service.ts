import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { PostgresService } from 'src/database/postgres.service';
import { SrvError } from 'src/response/dto';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly pg: PostgresService,
    private readonly utils: UtilsService,
  ) {}

  async register(dto: RegisterDto) {
    if (!this.utils.PasswordHandler.isStrongPassword(dto.password)) {
      throw new BadRequestException(
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
    });

    await this.pg.models.Session.create({
      userId: user.id,
      deviceId: dto.deviceId,
      lastActiveAt: new Date(),
    });

    return {
      message: 'User registered successfully',
      userId: user.id,
    };
  }
}
