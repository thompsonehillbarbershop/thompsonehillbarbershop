import { faker } from '@faker-js/faker'
import { CreateCustomerInput } from "../dto/create-customer.input"
import { ECustomerGender } from "../entities/customer.entity"

export function getRandomCustomerCreateInputData(data?: Partial<CreateCustomerInput>): CreateCustomerInput {
  return {
    name: data?.name || faker.commerce.productName(),
    birthDate: data?.birthDate || faker.date.birthdate(),
    phoneNumber: data?.phoneNumber || faker.phone.number(),
    profileImage: data?.profileImage || faker.image.urlPicsumPhotos(),
    gender: data?.gender || faker.helpers.enumValue(ECustomerGender),
    referralCodeUsed: data?.referralCodeUsed,
    partnershipId: data?.partnershipId,
    partnershipIdentificationId: data?.partnershipIdentificationId,
  }
}