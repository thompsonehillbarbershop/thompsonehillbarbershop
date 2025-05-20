import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsOptional, IsString } from "class-validator"
import { EAppointmentStatuses, EPaymentMethod } from "../entities/appointment.entity"

export class UpdateAppointmentInput {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  attendantId?: string

  @ApiProperty({ required: false, type: [String] })
  @IsString({ each: true })
  @IsOptional()
  serviceIds?: string[]

  @ApiProperty({ required: false })
  @IsEnum(EPaymentMethod)
  @IsOptional()
  paymentMethod?: EPaymentMethod

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  redeemCoupon?: string

  @ApiProperty({ required: false })
  @IsEnum(EAppointmentStatuses)
  @IsOptional()
  status?: EAppointmentStatuses
}
