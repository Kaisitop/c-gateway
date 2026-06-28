import { IsOptional, IsString } from 'class-validator';

export class DisablePushDto {
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
