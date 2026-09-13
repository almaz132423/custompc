import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PcBuildsModule } from './pc-builds/pc-builds.module.js';
import { LeadsModule } from './leads/leads.module.js';
import { ConfiguratorModule } from './configurator/configurator.module.js';
import { ComponentsModule } from './components/components.module.js';
import { PcBuildComponentsModule } from './pc-build-components/pc-build-components.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PcBuildsModule,
    LeadsModule,
    ConfiguratorModule,
    ComponentsModule,
    PcBuildComponentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
