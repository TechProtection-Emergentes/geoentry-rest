import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeviceModule } from './devices/DeviceModule';
import { LocationModule } from './locations/LocationModule';
import { ProfileModule } from './profiles/ProfileModule';
import { SensorModule } from './sensors/SensorModule';
import { ProximityEventModule } from './proximity-events/ProximityEventModule';
import { AiModule } from './ai/AiModule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DeviceModule,
    LocationModule,
    ProfileModule,
    SensorModule,
    ProximityEventModule,
    AiModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}