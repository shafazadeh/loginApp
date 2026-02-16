import {
  Controller,
  Post,
  Body,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { HttpExceptionFilter } from 'src/response/httpExceeption.filter';
import { ResponseInterceptor } from 'src/response/response.Interceptor';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'register user with email and password and deviceId',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
