import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PcBuildsAdminService } from './pc-builds-admin.service.js';
import { CreatePcBuildDto } from './dto/create-pc-build.dto.js';
import { UpdatePcBuildDto } from './dto/update-pc-build.dto.js';
import { CreatePcBuildImageDto } from './dto/create-pc-build-image.dto.js';

@Controller('admin/pc-builds')
@UseGuards(JwtAuthGuard)
export class PcBuildsAdminController {
  constructor(private readonly service: PcBuildsAdminService) {}

  @Get('categories')
  findCategories() {
    return this.service.findCategories();
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePcBuildDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePcBuildDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/images')
  addImage(@Param('id') id: string, @Body() dto: CreatePcBuildImageDto) {
    return this.service.addImage(id, dto);
  }

  @Delete(':id/images/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.service.removeImage(id, imageId);
  }
}
