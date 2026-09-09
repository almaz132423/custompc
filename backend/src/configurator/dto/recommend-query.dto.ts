import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Purpose, Resolution, ConfiguratorPriority } from '../../common/enums.js';

export class RecommendQueryDto {
  @IsOptional()
  @IsEnum(Purpose)
  purpose?: Purpose;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsEnum(Resolution)
  resolution?: Resolution;

  @IsOptional()
  @IsEnum(ConfiguratorPriority)
  priority?: ConfiguratorPriority;
}
