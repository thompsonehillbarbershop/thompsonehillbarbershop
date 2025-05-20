import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsOptional, IsString, IsUrl, MinLength } from "class-validator"
import { EUserRole, EUserStatus } from "../entities/user.entity"

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

  @ApiProperty({ enum: EUserStatus })
  @IsEnum(EUserStatus)
  @IsOptional()
  status?: EUserStatus

  @ApiProperty({ required: false })
  @IsOptional()
  profileImage?: string

  @ApiProperty({ required: false })
  @IsOptional()
  imageContentType?: string
}
