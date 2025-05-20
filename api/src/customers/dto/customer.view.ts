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
    this.createdAt = customer.createdAt
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
}