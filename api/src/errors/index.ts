import { BadRequestException } from "@nestjs/common"

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