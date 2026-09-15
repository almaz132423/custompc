import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ComponentsController } from './components.controller.js';
import { ComponentsService } from './components.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ComponentsController],
  providers: [ComponentsService],
})
export class ComponentsModule {}
