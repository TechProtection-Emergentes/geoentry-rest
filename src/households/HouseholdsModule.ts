import { Module } from '@nestjs/common';
import { HouseholdsController } from './controllers/HouseholdsController';
import { HouseholdsService } from './services/HouseholdsService';

@Module({
  controllers: [HouseholdsController],
  providers: [HouseholdsService],
})
export class HouseholdsModule {}
