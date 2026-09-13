import { IsEnum, IsInt, IsNumberString, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { Purpose, ProductStatus, Resolution } from '@prisma/client';

export class UpdatePcBuildDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumberString()
  price?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsEnum(Purpose)
  purpose?: Purpose;

  @IsOptional()
  @IsEnum(Resolution)
  resolution?: Resolution;

  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  buildTimeDays?: number;

  @IsOptional()
  @IsUrl()
  avitoUrl?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}
