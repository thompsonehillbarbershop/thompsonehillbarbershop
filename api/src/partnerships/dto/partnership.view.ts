import { ApiProperty } from "@nestjs/swagger"
import { EPartnershipDiscountType, EPartnershipType, Partnership } from "../entities/partnership.entity"

export class PartnershipView {
  constructor(partnership: Partnership) {
    this.id = partnership.id
    this.name = partnership.name
    this.identificationLabel = partnership.identificationLabel
    this.type = partnership.type
    this.discountValue = partnership.discountValue
    this.discountType = partnership.discountType
    this.createdAt = partnership.createdAt
    this.deletedAt = partnership.deletedAt || undefined
  }

  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  identificationLabel: string

  @ApiProperty()
  type: EPartnershipType

  @ApiProperty()
  discountValue: number

  @ApiProperty()
  discountType: EPartnershipDiscountType

  @ApiProperty()
  createdAt: Date

  @ApiProperty({ required: false })
  deletedAt?: Date
}