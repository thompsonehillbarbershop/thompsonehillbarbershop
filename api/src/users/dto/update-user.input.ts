import { OmitType, PartialType } from '@nestjs/swagger'
import { CreateUserInput } from "./create-user.input"

export class UpdateUserInput extends PartialType(OmitType(CreateUserInput, ['userName'])) { }