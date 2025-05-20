import { BadRequestException, InternalServerErrorException } from "@nestjs/common"

// Auth Errors
export class InvalidCredentialsException extends BadRequestException {
  constructor() {
    super("Invalid credentials")
  }
}

// User Errors
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

// Service Errors
export class ServiceNotFoundException extends BadRequestException {
  constructor() {
    super("Service not found")
  }
}

// Customer Errors
export class CustomerNotFoundException extends BadRequestException {
  constructor() {
    super("Customer not found")
  }
}

export class CustomerAlreadyExistsException extends BadRequestException {
  constructor() {
    super("Customer already exists")
  }
}

// Appointment
export class AppointmentNotFoundException extends BadRequestException {
  constructor() {
    super("Appointment not found")
  }
}

export class MissingServicesException extends BadRequestException {
  constructor() {
    super("Missing services in appointment registration")
  }
}