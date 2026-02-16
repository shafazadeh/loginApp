import { Module } from '@nestjs/common';
import { TestGuardService } from './test-guard.service';
import { TestGuardController } from './test-guard.controller';

@Module({
  controllers: [TestGuardController],
  providers: [TestGuardService],
})
export class TestGuardModule {}
