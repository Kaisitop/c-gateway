import { IsEmail, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsIn(['web', 'app'])
  channel?: 'web' | 'app';
}
