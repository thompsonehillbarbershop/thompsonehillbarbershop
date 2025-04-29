import { Controller, Post, Body, HttpCode } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthLoginInput } from "./dto/auth-login.input"
import { ApiBadRequestResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { AuthView } from "./dto/auth.view"
import { CreateUserInput } from "../users/dto/create-user.input"
import { InvalidCredentialsException, UserRegisterException } from "../errors"

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    type: AuthView,
  })
  @ApiInternalServerErrorResponse({
    type: UserRegisterException,
    example: 'Error when registering user',
  })
  register(@Body() data: CreateUserInput) {
    return this.authService.register(data)
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiOkResponse({
    type: AuthView,
  })
  @ApiBadRequestResponse({
    type: InvalidCredentialsException,
    example: 'Invalid credentials'
  })
  login(@Body() data: AuthLoginInput) {
    return this.authService.login(data)
  }
}
