import { PickType } from "@nestjs/swagger"
import { CreateUserInput } from "../../users/dto/create-user.input"

export class AuthLoginInput extends PickType(CreateUserInput, ["userName", "password"]) { }