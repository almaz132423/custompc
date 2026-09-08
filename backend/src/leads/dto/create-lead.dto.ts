import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum Purpose {
  GAMES = 'GAMES',
  WORK = 'WORK',
  MONTAGE = 'MONTAGE',
  THREE_D = 'THREE_D',
  STREAMING = 'STREAMING',
  AI = 'AI',
  UNIVERSAL = 'UNIVERSAL',
}

export class CreateLeadDto {
  @IsString()
  @MinLength(2, { message: 'Укажите имя (минимум 2 символа)' })
  name: string;

  @IsString()
  @MinLength(5, { message: 'Укажите телефон или Telegram' })
  contact: string;

  @IsOptional()
  @IsString()
  budget?: string;

  @IsOptional()
  @IsEnum(Purpose, { message: 'Некорректное назначение' })
  purpose?: Purpose;

  @IsOptional()
  @IsString()
  comment?: string;
}
