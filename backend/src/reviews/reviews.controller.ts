import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { ReviewsService } from './reviews.service.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findPublic() { return this.reviewsService.findPublic(); }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  findAll() { return this.reviewsService.findAll(); }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) { return this.reviewsService.findOne(id); }

  @Post('admin')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReviewDto) { return this.reviewsService.create(dto); }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto) { return this.reviewsService.update(id, dto); }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { return this.reviewsService.remove(id); }
}