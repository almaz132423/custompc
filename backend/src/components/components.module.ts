import { Module } from '@nestjs/common';
import { ComponentsController } from './components.controller.js';
import { ComponentsService } from './components.service.js';

@Module({
  controllers: [ComponentsController],
  providers: [ComponentsService],
})
export class ComponentsModule {}
