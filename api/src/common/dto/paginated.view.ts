import { Type } from '@nestjs/common'
import { ApiProperty, ApiExtraModels } from '@nestjs/swagger'

export function createPaginatedDto<T extends Type<any>>(itemType: T) {
  @ApiExtraModels(itemType)
  class PaginatedDto {
    @ApiProperty({ type: [itemType] })
    data: T[]

    @ApiProperty({ example: 1 })
    page: number

    @ApiProperty({ example: 10 })
    limit: number

    @ApiProperty({ example: 100 })
    total: number
  }

  return PaginatedDto
}
