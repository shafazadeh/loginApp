import { Controller, Get, UseGuards } from '@nestjs/common';
import { TestGuardService } from './test-guard.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { RolesGuard } from 'src/auth/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('test-guard')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TestGuardController {
  constructor(private readonly testGuardService: TestGuardService) {}
  @Get('admin-only')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'admin-only' })
  adminOnly() {
    return { message: 'سلام ادمین عزیز! به پنل خوش آمدید.' };
  }

  @Get('user-only')
  @Roles('USER')
  @ApiOperation({ summary: 'user-only' })
  userOnly() {
    return { message: 'سلام کاربر گرامی! اینجا فضا برای شماست.' };
  }

  @Get('public-for-users')
  @Roles('ADMIN', 'USER')
  @ApiOperation({ summary: 'admin-user' })
  commonArea() {
    return { message: 'سلام! هر دو گروه می‌توانند این را ببینند.' };
  }

  @Get('just-logged-in')
  @ApiOperation({ summary: 'role not important' })
  justLoggedIn() {
    return { message: 'شما لاگین هستید، نقش مهم نیست.' };
  }
}
