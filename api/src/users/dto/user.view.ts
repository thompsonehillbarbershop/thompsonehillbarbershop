import { ApiProperty } from "@nestjs/swagger"
import { EUserRole, EUserStatus, User } from "../entities/user.entity"

export class UserView {
  constructor(user: User) {
    this.id = user.id
    this.name = user.name
    this.userName = user.userName
    this.role = user.role
    this.profileImage = user.profileImage
    this.imageSignedUrl = user.imageSignedUrl
    this.createdAt = user.createdAt
    this.status = user.status
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
  imageSignedUrl?: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  status: EUserStatus
}