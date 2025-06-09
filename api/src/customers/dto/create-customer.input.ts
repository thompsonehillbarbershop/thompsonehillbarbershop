import { ApiProperty } from "@nestjs/swagger"
import { IsDateString, IsEnum, IsMobilePhone, IsOptional, IsPhoneNumber, IsString } from "class-validator"
import { ECustomerGender } from "../entities/customer.entity"
import { IsBrazilianPhoneE164 } from "../../validators/is-brazilian-phone.decorator"

export class CreateCustomerInput {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsBrazilianPhoneE164()
  phoneNumber: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  profileImage?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageContentType?: string

  @ApiProperty()
  @IsDateString()
  birthDate: Date

  @ApiProperty()
  @IsEnum(ECustomerGender)
  gender: ECustomerGender

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  referralCodeUsed?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  partnershipId?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  partnershipIdentificationId?: string
}
