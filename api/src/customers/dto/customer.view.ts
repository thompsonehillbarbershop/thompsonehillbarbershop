import { ApiProperty } from "@nestjs/swagger"
import { Customer, ECustomerGender } from "../entities/customer.entity"

export class CustomerView {
  constructor(customer: Customer) {
    this.id = customer.id
    this.name = customer.name
    this.phoneNumber = customer.phoneNumber
    this.profileImage = customer.profileImage
    this.signedUrl = customer.signedUrl
    this.birthDate = customer.birthDate
    this.gender = customer.gender
    this.referralCode = customer.referralCode
    this.referralCodeUsed = customer.referralCodeUsed
    this.referralCodeCount = customer.referralCodeCount
    this.createdAt = customer.createdAt
    this.partnershipId = customer.partnershipId
    this.partnershipIdentificationId = customer.partnershipIdentificationId
  }

  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  phoneNumber: string

  @ApiProperty()
  profileImage?: string

  @ApiProperty()
  signedUrl?: string

  @ApiProperty()
  birthDate: Date

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  gender: ECustomerGender

  @ApiProperty()
  referralCode: string

  @ApiProperty()
  referralCodeUsed?: string

  @ApiProperty()
  referralCodeCount: number

  @ApiProperty()
  partnershipId?: string

  @ApiProperty()
  partnershipIdentificationId?: string
}