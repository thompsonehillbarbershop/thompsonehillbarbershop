import { PartialType } from '@nestjs/swagger'
import { CreateServiceInput } from "./create-service.input"

export class UpdateServiceInput extends PartialType(CreateServiceInput) { }