import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export const AUTH_COOKIE_NAME = 'customps_token';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    const token = request.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    try {
      request.user = this.jwtService.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Недействительный токен');
    }
  }
}
