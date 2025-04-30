import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsString, MinLength } from "class-validator"
import { EUserRole } from "../entities/user.entity"

export class CreateUserInput {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsString()
  userName: string

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({ enum: EUserRole })
  @IsEnum(EUserRole)
  role: EUserRole
}
