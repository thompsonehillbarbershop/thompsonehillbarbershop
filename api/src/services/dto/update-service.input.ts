import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { CreateServiceInput } from "./create-service.input"
import { IsBoolean } from "class-validator"

export class UpdateServiceInput extends PartialType(CreateServiceInput) {
  @ApiPropertyOptional()
  @IsBoolean()
  delete?: boolean = false
}