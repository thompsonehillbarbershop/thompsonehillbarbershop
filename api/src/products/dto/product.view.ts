import { ApiProperty } from "@nestjs/swagger"
import { Product } from "../entities/product.entity"

export class ProductView {
  constructor(product: Product) {
    this.id = product.id
    this.name = product.name
    this.description = product.description
    this.value = product.value
    this.promoValue = product.promoValue
    this.promoEnabled = product.promoEnabled
    this.coverImage = product.coverImage
    this.signedUrl = product.signedUrl
    this.createdAt = product.createdAt
    this.deletedAt = product.deletedAt || undefined
  }

  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  description?: string

  @ApiProperty()
  value: number

  @ApiProperty()
  promoValue?: number

  @ApiProperty()
  promoEnabled?: boolean

  @ApiProperty()
  coverImage?: string

  @ApiProperty()
  signedUrl?: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  deletedAt?: Date
}