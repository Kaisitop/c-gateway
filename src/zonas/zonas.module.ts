import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ZonasController } from './zonas.controller';
import { NatsModule } from '../transports/nats.module';
import { envs } from '../config/envs';

@Module({
  controllers: [ZonasController],
  imports: [
    NatsModule,
    JwtModule.register({ secret: envs.jwtService }),
  ],
})
export class ZonasModule {}
