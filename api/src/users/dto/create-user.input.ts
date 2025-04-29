import { ApiProperty } from "@nestjs/swagger"
import { IsString, MinLength } from "class-validator"

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
}
