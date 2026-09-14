import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ValidateComponentsDto {
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  componentIds!: string[];
}
