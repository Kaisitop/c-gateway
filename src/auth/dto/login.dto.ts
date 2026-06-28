import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)

  password: string;

  @IsString()
  @IsOptional()
  fcmToken?: string;

  @IsString()
  @IsOptional()
  @IsIn(['android', 'ios'])
  plataforma?: string;
}
