import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { UserRole } from 'src/database/models/User.model';
import { PostgresService } from 'src/database/postgres.service';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly pg: PostgresService,
    private readonly utils: UtilsService,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.SEED_ROOT_ADMIN !== 'true') {
      return;
    }
    await this.seedRootAdmin();
  }

  private async seedRootAdmin(): Promise<void> {
    const adminEmail = 'root@snapp.com';
    const adminPassword = 'Root@1234'; // strong password ✅

    const exists = await this.pg.models.User.findOne({
      where: { email: adminEmail },
    });

    if (exists) {
      this.logger.verbose('Root admin already exists');
      return;
    }

    const hashedPassword =
      await this.utils.PasswordHandler.hashPassword(adminPassword);

    await this.pg.models.User.create({
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    this.logger.log('✅ Root admin has been seeded successfully');
  }
}
