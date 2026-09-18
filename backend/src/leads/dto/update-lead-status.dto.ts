import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus, { message: 'Некорректный статус заявки' })
  status: LeadStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
