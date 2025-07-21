import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"

export class CreateAppointmentInput {
  @ApiProperty()
  @IsString()
  customerId: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  attendantId?: string

  @ApiProperty({ type: [String], required: false })
  @IsString({ each: true })
  @IsOptional()
  serviceIds?: string[]

  @ApiProperty({ required: false, type: [String] })
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[]

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  redeemCoupon?: string

  createdAt?: Date
}
