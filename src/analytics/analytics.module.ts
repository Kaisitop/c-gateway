import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AnalyticsController } from './analytics.controller';
import { NatsModule } from '../transports/nats.module';
import { envs } from '../config/envs';

@Module({
  imports: [
    NatsModule,
    JwtModule.register({ secret: envs.jwtService }),
  ],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}