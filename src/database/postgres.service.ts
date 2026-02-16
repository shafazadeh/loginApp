/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import config from 'config';
import * as models from './models';
import { dbModels } from './models';

@Injectable()
export class PostgresService implements OnModuleInit {
  public connection: Sequelize;
  private logger = new Logger('databases/postgres/postgres.service');

  async onModuleInit() {
    console.log('🔹 Trying to connect to database with config');

    const pgConfig: any = config.get('databases.postgres.core');

    const sequelizeInstance = new Sequelize({
      dialect: pgConfig.dialect,
      host: pgConfig.host,
      port: pgConfig.port,
      username: pgConfig.username,
      password: pgConfig.password,
      database: pgConfig.database,
      logging: false,
    });

    sequelizeInstance.addModels(dbModels);

    /* This code snippet is defining a relationship between two models in a Sequelize database setup. */
    models.User.hasMany(models.Session, {
      foreignKey: 'userId',
      as: 'sessions',
    });

    models.Session.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    try {
      await sequelizeInstance.sync({ alter: true });
    } catch (e) {
      this.logger.fatal('Syncing error');
      this.logger.fatal(e);
      console.log(e);
      process.exit(1);
    }

    this.logger.verbose('Postgres database is connected!');
    this.connection = sequelizeInstance;
  }

  public models = models;
}
