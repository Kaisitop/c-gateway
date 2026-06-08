import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { NatsModule } from '../transports/nats.module';
import { envs } from '../config/envs';

@Module({
  controllers: [AuthController],
  providers: [],
  imports: [
    NatsModule,
    JwtModule.register({
      secret: envs.jwtService,
    }),
  ],
})
export class AuthModule {}
