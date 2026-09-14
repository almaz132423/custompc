import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateCompatibilityRuleDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsObject() rule?: Record<string, unknown>;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
