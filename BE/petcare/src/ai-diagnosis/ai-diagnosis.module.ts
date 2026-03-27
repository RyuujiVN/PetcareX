import { Module } from '@nestjs/common';
import { AiDiagnosisService } from './ai-diagnosis.service';

@Module({
  providers: [AiDiagnosisService]
})
export class AiDiagnosisModule {}
