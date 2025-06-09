import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsNumber, IsPositive, IsString, Min } from "class-validator"
import { EPartnershipDiscountType, EPartnershipType } from "../entities/partnership.entity"

export class CreatePartnershipInput {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsString()
  identificationLabel: string

  @ApiProperty()
  @IsEnum(EPartnershipType)
  type: EPartnershipType

  @ApiProperty()
  @IsNumber()
  @Min(0)
  discountValue: number

  @ApiProperty()
  @IsEnum(EPartnershipDiscountType)
  discountType: EPartnershipDiscountType
}
