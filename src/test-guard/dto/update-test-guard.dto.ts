import { PartialType } from '@nestjs/swagger';
import { CreateTestGuardDto } from './create-test-guard.dto';

export class UpdateTestGuardDto extends PartialType(CreateTestGuardDto) {}
