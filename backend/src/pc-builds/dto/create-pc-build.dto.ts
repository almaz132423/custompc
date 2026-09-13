import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumberString, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { Purpose, ProductStatus, Resolution } from '@prisma/client';

export class CreatePcBuildDto {
  @IsString()
  slug!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumberString()
  price!: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsEnum(Purpose)
  purpose!: Purpose;

  @IsOptional()
  @IsEnum(Resolution)
  resolution?: Resolution;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @IsOptional()
  @Type(() => Number)
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
