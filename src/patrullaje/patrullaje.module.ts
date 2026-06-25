import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { envs } from '../config/envs';
import { NatsModule } from '../transports/nats.module';
import { PatrullajeController } from './patrullaje.controller';

@Module({
  imports: [
    NatsModule,
    JwtModule.register({ secret: envs.jwtService }),
  ],
  controllers: [PatrullajeController],
})
export class PatrullajeModule {}
