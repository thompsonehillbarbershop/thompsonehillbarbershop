import { BadRequestException, InternalServerErrorException } from "@nestjs/common"

export class InvalidCredentialsException extends BadRequestException {
  constructor() {
    super("Invalid credentials")
  }
}

export class UserNotFoundException extends BadRequestException {
  constructor() {
    super("User not found")
  }
}

export class UserAlreadyExistsException extends BadRequestException {
  constructor() {
    super("User already exists")
  }
}

export class UserRegisterException extends InternalServerErrorException {
  constructor() {
    super("Error when registering user")
  }
}