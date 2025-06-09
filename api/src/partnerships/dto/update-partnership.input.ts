import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsBoolean } from "class-validator"
import { CreatePartnershipInput } from "./create-partnership.input"

export class UpdatePartnershipInput extends PartialType(CreatePartnershipInput) {
  @ApiPropertyOptional()
  @IsBoolean()
  delete?: boolean = false
}