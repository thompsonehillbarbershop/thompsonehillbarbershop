import { ApiProperty } from "@nestjs/swagger"
import { EUserRole, User } from "../../users/entities/user.entity"

export class AuthView {
  constructor(data: User, token: string) {
    this.id = data.id
    this.userName = data.userName
    this.token = token
    this.userRole = data.role
  }

  @ApiProperty()
  id: string

  @ApiProperty()
  userName: string

  @ApiProperty({ enum: EUserRole })
  userRole: EUserRole

  @ApiProperty()
  token: string
}