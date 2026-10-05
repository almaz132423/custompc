import { IsBoolean, IsNumberString, IsOptional, IsString } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  type?: string;

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
