import { IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Укажите телефон или email' })
  contact?: string;

  @IsOptional()
  @IsNumberString()
  agreedPrice?: string;
}
