import { Module } from '@nestjs/common';
import { ProximityEventController } from './controllers/ProximityEventController';
import { ProximityEventService } from './services/ProximityEventService';
import { ProximityEventRepository } from './repository/ProximityEventRepository';

import { AiModule } from '../ai/AiModule';

@Module({
  imports: [AiModule],
  controllers: [ProximityEventController],
  providers: [ProximityEventService, ProximityEventRepository],
  exports: [ProximityEventService, ProximityEventRepository],
})
export class ProximityEventModule {}
