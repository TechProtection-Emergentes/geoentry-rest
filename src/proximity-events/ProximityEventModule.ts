import { Module } from '@nestjs/common';
import { ProximityEventController } from './controllers/ProximityEventController';
import { ProximityEventService } from './services/ProximityEventService';
import { ProximityEventRepository } from './repository/ProximityEventRepository';

import { AiModule } from '../ai/AiModule';
import { SensorModule } from '../sensors/SensorModule';

@Module({
  imports: [AiModule, SensorModule],
  controllers: [ProximityEventController],
  providers: [ProximityEventService, ProximityEventRepository],
  exports: [ProximityEventService, ProximityEventRepository],
})
export class ProximityEventModule {}
