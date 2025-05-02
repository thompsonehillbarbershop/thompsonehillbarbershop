import { IsEnum, IsOptional } from "class-validator"
import { EUserRole } from "../entities/user.entity"
import { ApiProperty } from "@nestjs/swagger"

export class QueryUserInput {
  @ApiProperty()
  @IsEnum(EUserRole)
  @IsOptional()
  role?: EUserRole
}