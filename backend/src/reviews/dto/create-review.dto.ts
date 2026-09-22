import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @MaxLength(160)
  customerName!: string;

  @IsString()
  text!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  purchasedBuild?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}