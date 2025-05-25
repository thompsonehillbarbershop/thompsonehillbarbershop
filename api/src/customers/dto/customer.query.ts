import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber, IsIn, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CustomerQuery {
  @ApiPropertyOptional({ description: "Query by name (partial, case-insensitive)" })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: "Query by phone number (exact match)" })
  @IsOptional()
  @IsString()
  phoneNumber?: string

  @ApiPropertyOptional({ description: "Query by referral code (exact match)" })
  @IsOptional()
  @IsString()
  referralCode?: string

  @ApiPropertyOptional({ default: 1, description: "Page number" })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: "Number of items per page" })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 'createdAt', description: "Field to sort by" })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'], description: "Sort order" })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
