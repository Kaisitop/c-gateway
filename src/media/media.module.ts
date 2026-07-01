import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { envs } from '../config/envs';

@Module({
  imports: [
    JwtModule.register({
      secret: envs.jwtService,
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
