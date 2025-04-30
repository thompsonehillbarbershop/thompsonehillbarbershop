import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsOptional, IsString, IsUrl, MinLength } from "class-validator"
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

  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  profileImage?: string
}

// Only for swagger documentation
// export class CreateUserMultipartInput extends CreateUserInput {
//   @ApiProperty({
//     type: 'string',
//     format: 'binary',
//     required: false,
//   })
//   profileImage?: any
// }
