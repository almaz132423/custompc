import { IsBoolean, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name!: string;

  @IsString()
  type!: string;

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
