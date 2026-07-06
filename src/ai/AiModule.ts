import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiInferenceService } from './services/AiInferenceService';

@Module({
  imports: [HttpModule],
  providers: [AiInferenceService],
  exports: [AiInferenceService],
})
export class AiModule {}
