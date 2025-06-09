import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator"

export class CreateServiceInput {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty()
  @IsNumber()
  value: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  promoValue?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  promoEnabled?: boolean

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverImage?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageContentType?: string

  @ApiProperty()
  @IsInt()
  @Min(1)
  weight: number
}
