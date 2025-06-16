import { ApiProperty } from "@nestjs/swagger"
import { IsDateString, IsOptional, IsString } from "class-validator"

export class SummaryBodyInput {
  @ApiProperty()
  @IsDateString()
  from: Date

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  to?: Date
}
