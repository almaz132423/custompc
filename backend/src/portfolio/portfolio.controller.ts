import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreatePortfolioDto } from './dto/create-portfolio.dto.js';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto.js';
import { PortfolioService } from './portfolio.service.js';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  findPublic() {
    return this.portfolioService.findPublic();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.portfolioService.findAll();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.portfolioService.findOne(id);
  }

  @Get(':slug')
  findPublicOne(@Param('slug') slug: string) {
    return this.portfolioService.findPublicOne(slug);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePortfolioDto) {
    return this.portfolioService.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdatePortfolioDto) {
    return this.portfolioService.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.portfolioService.remove(id);
  }
}