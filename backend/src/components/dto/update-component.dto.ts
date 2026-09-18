import { IsBoolean, IsNumberString, IsOptional, IsString } from 'class-validator';

export class UpdateComponentDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumberString()
  price?: string;

  @IsOptional()
  @IsNumberString()
  costPrice?: string | null;

  @IsOptional()
  specs?: unknown;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  compatibility?: unknown;
}
