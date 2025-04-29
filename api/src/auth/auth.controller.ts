import { Controller, Post, Body, HttpCode } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthLoginInput } from "./dto/auth-login.input"
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { AuthView } from "./dto/auth.view"
import { CreateUserInput } from "../users/dto/create-user.input"

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'Created',
    type: AuthView,
  })
  register(@Body() data: CreateUserInput) {
    return this.authService.register(data)
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: AuthView,
  })
  login(@Body() data: AuthLoginInput) {
    return this.authService.login(data)
  }
}
