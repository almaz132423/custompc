import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatusStage, PaymentStatus } from '@prisma/client';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatusStage)
  status?: OrderStatusStage;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
