import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const JWT_EXPIRES_IN: any = process.env.JWT_EXPIRES_IN ?? '7d';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: JWT_EXPIRES_IN,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}