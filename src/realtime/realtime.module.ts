import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { envs } from '../config/envs';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { RealtimeController } from './realtime.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: envs.jwtService,
    }),
  ],
  controllers: [RealtimeController],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
