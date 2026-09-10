import { IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { Purpose } from '../../common/enums.js';

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

  // Откуда пришла заявка: "Конфигуратор", "Покупка ПК", название услуги и т.д.
  @IsOptional()
  @IsString()
  category?: string;

  // Снапшот результата конфигуратора (раздел 22 ТЗ, поле "Конфигурация")
  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}
