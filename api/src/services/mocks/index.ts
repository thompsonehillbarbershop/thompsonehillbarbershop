import { CreateServiceInput } from "../dto/create-service.input"
import { faker } from '@faker-js/faker'

export function getRandomServiceCreateInputData(data?: Partial<CreateServiceInput>): CreateServiceInput {
  return {
    name: data?.name || faker.commerce.productName(),
    description: data?.description || faker.commerce.productDescription(),
    value: data?.value || Number(faker.commerce.price()),
    promoValue: data?.promoValue,
    promoEnabled: data?.promoEnabled,
    coverImage: data?.coverImage || faker.image.urlPicsumPhotos(),
  }
}