import {
  Controller,
  Post,
  Body,
  UseFilters,
  UseInterceptors,
  Headers,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { HttpExceptionFilter } from 'src/response/httpExceeption.filter';
import { ResponseInterceptor } from 'src/response/response.Interceptor';
import { ApiOperation } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import type { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
@Controller('auth')
@Public()
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'register user' })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  @Post('login')
  @ApiOperation({ summary: 'login user' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }
}
