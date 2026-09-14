import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCompatibilityRuleDto {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string | null;
  @IsObject() rule!: Record<string, unknown>;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
