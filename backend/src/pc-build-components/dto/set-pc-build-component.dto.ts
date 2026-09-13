import { IsInt, IsString, Min } from 'class-validator';

export class SetPcBuildComponentDto {
  @IsString()
  componentId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
