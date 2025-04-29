import { ApiProperty } from "@nestjs/swagger"
import { User } from "../../users/entities/user.entity"

export class AuthView {
  constructor(data: User, token: string) {
    this.id = data.id
    this.userName = data.userName
    this.token = token
  }

  @ApiProperty()
  id: string
  @ApiProperty()
  userName: string
  @ApiProperty()
  token: string
}