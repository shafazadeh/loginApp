/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import config from 'config';
import { AuthModule } from 'src/auth/auth.module';
import { TestGuardModule } from 'src/test-guard/test-guard.module';

interface SwaggerModuleItem {
  path: string;
  module: any;
  bearer?: boolean;
}

export function setupSwagger(app: INestApplication) {
  const apiVersion = config.get<string>('server.apiVersion');
  const swaggerTitle = config.get<string>('server.swagger.title');
  const swaggerDescription = config.get<string>('server.swagger.description');
  const swaggerVersion = config.get<string>('server.swagger.version');

  const modules: SwaggerModuleItem[] = [
    {
      path: 'auth',
      module: AuthModule,
      bearer: true,
    },
    {
      path: 'test-guard',
      module: TestGuardModule,
      bearer: true,
    },
  ];

  modules.forEach(({ path, module, bearer }) => {
    const builder = new DocumentBuilder()
      .setTitle(`${swaggerTitle} - ${path.toUpperCase()}`)
      .setDescription(swaggerDescription)
      .setVersion(swaggerVersion);

    if (bearer) {
      builder.addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'Authorization',
      );
    }

    const document = SwaggerModule.createDocument(app, builder.build(), {
      include: [module],
    });

    SwaggerModule.setup(`${apiVersion}/docs/${path}`, app, document);
  });
}
