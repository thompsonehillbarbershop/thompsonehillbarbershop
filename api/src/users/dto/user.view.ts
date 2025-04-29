import { ApiProperty } from "@nestjs/swagger"
import { User } from "../entities/user.entity"

export class UserView {
  constructor(user: User) {
    this.id = user.id
    this.name = user.name
    this.userName = user.userName
  }

  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  userName: string
}