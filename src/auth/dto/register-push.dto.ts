import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterPushDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @IsString()
  @IsOptional()
  @IsIn(['android', 'ios'])
  plataforma?: string;
}
