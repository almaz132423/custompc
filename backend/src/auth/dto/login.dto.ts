import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль минимум 6 символов' })
  password: string;
}
