import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsUUID } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Strong@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique device identifier',
  })
  @IsUUID()
  deviceId: string;
}
