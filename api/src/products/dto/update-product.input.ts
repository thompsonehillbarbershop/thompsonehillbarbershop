import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsBoolean } from "class-validator"
import { CreateProductInput } from "./create-product.input"

export class UpdateProductInput extends PartialType(CreateProductInput) {
  @ApiPropertyOptional()
  @IsBoolean()
  delete?: boolean = false
}