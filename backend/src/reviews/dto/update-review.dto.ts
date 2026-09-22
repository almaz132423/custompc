import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  customerName?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  purchasedBuild?: string;

  @IsOptional()
  isPublished?: boolean;
}