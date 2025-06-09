import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger'
import { CreateUserInput } from "./create-user.input"
import { Transform } from "class-transformer"
import { IsBoolean, IsOptional } from "class-validator"

export class UpdateUserInput extends PartialType(OmitType(CreateUserInput, ['userName'])) {
  @ApiPropertyOptional()
  @IsBoolean()
  delete?: boolean = false
}