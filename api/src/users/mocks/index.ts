import { faker } from '@faker-js/faker'
import { CreateUserInput } from "../dto/create-user.input"
import { EUserRole, EUserStatus } from "../entities/user.entity"
import slugify from "slugify"
import { capitalizeName } from "../../utils"

export function getRandomUserData(data?: Partial<CreateUserInput>): CreateUserInput {
  return {
    name: data?.name || capitalizeName(faker.person.fullName()),
    userName: data?.userName || slugify(faker.internet.username(), { lower: true, strict: true }),
    password: data?.password || faker.internet.password({ length: 12 }),
    role: data?.role || faker.helpers.enumValue(EUserRole),
    status: data?.status || faker.helpers.enumValue(EUserStatus),
    profileImage: data?.profileImage || faker.image.urlPicsumPhotos(),
  }
}