import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStatus } from '../../common/enums.js';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus, { message: 'Некорректный статус заявки' })
  status: LeadStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
