import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUrl, Min } from 'class-validator';

export class CreatePcBuildImageDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
