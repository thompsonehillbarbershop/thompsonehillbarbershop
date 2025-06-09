import { CreatePartnershipInput } from "../dto/create-partnership.input"
import { faker } from '@faker-js/faker'
import { EPartnershipDiscountType, EPartnershipType } from "../entities/partnership.entity"

export function getRandomPartnershipCreateInputData(data?: Partial<CreatePartnershipInput>): CreatePartnershipInput {
  return {
    name: data?.name || faker.commerce.productName(),
    identificationLabel: data?.identificationLabel || faker.string.alphanumeric(10),
    type: data?.type || faker.helpers.enumValue(EPartnershipType),
    discountValue: data?.discountValue || Number(faker.commerce.price()),
    discountType: data?.discountType || faker.helpers.enumValue(EPartnershipDiscountType)
  }
}