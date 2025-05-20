import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsOptional } from "class-validator"

export class AppointmentQuery {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  onlyToday: boolean = false
}