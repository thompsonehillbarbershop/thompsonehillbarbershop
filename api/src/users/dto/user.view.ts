import { ApiProperty } from "@nestjs/swagger"
import { EUserRole, User } from "../entities/user.entity"

export class UserView {
  constructor(user: User) {
    this.id = user.id
    this.name = user.name
    this.userName = user.userName
    this.role = user.role
    this.profileImage = user.profileImage
    this.createdAt = user.createdAt
  }

  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  userName: string

  @ApiProperty()
  role: EUserRole

  @ApiProperty()
  profileImage?: string

  @ApiProperty()
  createdAt: Date
}