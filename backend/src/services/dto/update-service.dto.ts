import { IsBoolean, IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { ServiceType } from '@prisma/client';

export class UpdateServiceDto {
  @IsOptional()
  @IsEnum(ServiceType)
  type?: ServiceType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumberString()
  priceFrom?: string;

  @IsOptional()
  @IsNumberString()
  priceTo?: string;

  @IsOptional()
  @IsNumberString()
  durationDays?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
