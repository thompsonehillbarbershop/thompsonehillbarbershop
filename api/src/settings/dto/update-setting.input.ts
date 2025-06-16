import { ApiProperty } from "@nestjs/swagger"
import { IsNumber, IsOptional } from "class-validator"

export class UpdateSettingDto {
  @ApiProperty({ required: false, type: Number })
  @IsNumber()
  @IsOptional()
  creditCardFee?: number

  @ApiProperty({ required: false, type: Number })
  @IsNumber()
  @IsOptional()
  debitCardFee?: number
}
