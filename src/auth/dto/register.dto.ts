/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Strong@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty({ message: 'deviceId الزامی است' })
  @IsUUID('4', { message: 'deviceId باید UUID v4 معتبر باشد' })
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  deviceId: string;
}
