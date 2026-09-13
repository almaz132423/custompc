import { IsBoolean, IsInt, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

export class CreateComponentDto {
  @IsString()
  categoryId!: string;

  @IsString()
  manufacturer!: string;

  @IsString()
  model!: string;

  @IsNumberString()
  price!: string;

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
