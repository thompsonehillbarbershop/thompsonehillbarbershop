import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsBoolean, IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, Min } from "class-validator"
import { EAppointmentStatuses, EPaymentMethod } from "../entities/appointment.entity"
import { Transform, Type } from "class-transformer"

export class AppointmentQuery {
  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  onlyToday?: boolean = false

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fromDate?: Date

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  toDate?: Date

  @ApiPropertyOptional()
  @IsEnum(EAppointmentStatuses)
  @IsOptional()
  status?: EAppointmentStatuses

  @ApiPropertyOptional()
  @IsEnum(EPaymentMethod)
  @IsOptional()
  paymentMethod?: EPaymentMethod

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attendantId?: string

  @ApiPropertyOptional({ default: 1, description: "Page number" })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: "Number of items per page" })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 'createdAt', description: "Field to sort by" })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'], description: "Sort order" })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}