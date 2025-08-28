import { Controller, Post, Body, UseGuards, Get, Delete, Query, Param } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthLoginInput } from "./dto/auth-login.input"
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { AuthView } from "./dto/auth.view"
import { InvalidCredentialsException } from "../errors"
import { CreateApiKeyInput } from "./dto/auth-create-api-key.input"
import { JwtAuthGuard } from "./guards/jwt-auth/jwt-auth.guard"
import { AuthApiKeyView } from "./dto/auth-api-key.view"
import { AdminGuard } from "../users/guards/is-admin.guard"
import { CreateUserInput } from "../users/dto/create-user.input"

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  // @Post('register')
  // @HttpCode(201)
  // @ApiOperation({ summary: 'Register a new user' })
  // @ApiCreatedResponse({
  //   type: AuthView,
  // })
  // @ApiInternalServerErrorResponse({
  //   type: UserRegisterException,
  //   example: 'Error when registering user',
  // })
  register(data: CreateUserInput) {
    return this.authService.register(data)
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with credentials' })
  @ApiOkResponse({
    type: AuthView,
  })
  @ApiBadRequestResponse({
    type: InvalidCredentialsException,
    example: 'Invalid credentials'
  })
  login(@Body() data: AuthLoginInput) {
    console.log("Logging in user |", data)
    return this.authService.login(data)
  }

  @Post('api-key')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create API key' })
  @ApiOkResponse({
    type: AuthApiKeyView,
  })
  createApiKey(@Body() data: CreateApiKeyInput) {
    return this.authService.createApiKey(data)
  }

  @Get('api-key')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get API keys' })
  @ApiOkResponse({
    type: [AuthApiKeyView],
  })
  getApiKeys() {
    return this.authService.listKeys()
  }

  @Delete('api-key/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete API key' })
  @ApiOkResponse({
    description: 'API key deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid API key ID',
    example: 'Invalid API key ID'
  })
  deleteApiKey(@Param('id') id: string) {
    return this.authService.deleteApiKey(id)
  }
}
