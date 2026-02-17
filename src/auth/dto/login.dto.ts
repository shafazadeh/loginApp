/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Strong@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @Transform(({ value }) => value?.trim()?.toLowerCase())
  @IsUUID('4', { message: 'deviceId باید UUID v4 معتبر باشد' })
  @IsOptional()
  deviceId?: string;
}
