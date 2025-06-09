import { ApiProperty } from "@nestjs/swagger"
import { IApiKey } from "../entities/api-key.entity"

export class AuthApiKeyView {
  constructor(apiKey: IApiKey) {
    this.id = apiKey.id
    this.name = apiKey.name
    this.key = apiKey.key
    this.createdAt = apiKey.createdAt
  }

  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  key?: string

  @ApiProperty()
  createdAt: Date
}