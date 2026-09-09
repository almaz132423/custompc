import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule  } from './prisma/prisma.module.js';
import { PcBuildsModule } from './pc-builds/pc-builds.module.js'
import { LeadsModule } from './leads/leads.module.js'
import { ConfiguratorModule } from './configurator/configurator.module.js'

@Module({
  imports: [PrismaModule, PcBuildsModule, LeadsModule, ConfiguratorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
 