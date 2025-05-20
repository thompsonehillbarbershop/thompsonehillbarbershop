import { ApiProperty } from "@nestjs/swagger"
import { Service } from "../entities/service.entity"

export class ServiceView {
  constructor(service: Service) {
    this.id = service.id
    this.name = service.name
    this.description = service.description
    this.value = service.value
    this.coverImage = service.coverImage
    this.signedUrl = service.signedUrl
    this.createdAt = service.createdAt
  }

  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  description?: string

  @ApiProperty()
  value: number

  @ApiProperty()
  coverImage?: string

  @ApiProperty()
  signedUrl?: string

  @ApiProperty()
  createdAt: Date
}