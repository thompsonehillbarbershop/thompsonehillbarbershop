import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode, Req, Put, Patch } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserInput } from './dto/create-user.input'
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { UserView } from "./dto/user.view"
import { UpdateUserInput } from "./dto/update-user.input"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"
import { UserNotFoundException } from "../errors"
import { AdminGuard } from "./guards/is-admin.guard"
import { CombinedAuthGuard } from "../auth/guards/jwt-api-key/jwt-api-key.guard"

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    type: CreateUserInput,
  })
  @ApiCreatedResponse({
    type: UserView,
  })
  @ApiBadRequestResponse({
    description: 'User already exists',
    schema: {
      example: "User already exists"
    }
  })
  async create(
    @Body() data: CreateUserInput
  ) {
    return new UserView(await this.usersService.create(data))
  }

  @Get()
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({
    type: [UserView],
  })
  async findAll() {
    return (await this.usersService.findAll()).map(user => new UserView(user))
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    type: UserView,
  })
  @ApiBadRequestResponse({
    type: UserNotFoundException,
    example: "User not found"
  })
  async getProfile(
    @Req() req,
  ) {
    const id = req.user.id as string
    return new UserView(await this.usersService.findOne({ id }))
  }

  @Get('attendants')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get all available attendants' })
  @ApiOkResponse({
    type: [UserView],
  })
  async getAttendants() {
    return (await this.usersService.getAvailableAttendants()).map(user => new UserView(user))
  }

  @Get(':id')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({
    type: UserView,
  })
  @ApiBadRequestResponse({
    type: UserNotFoundException,
    example: "User not found"
  })
  async findOne(@Param('id') id: string) {
    return new UserView(await this.usersService.findOne({ id }))
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user by id' })
  @ApiOkResponse({
    type: UserView,
  })
  @ApiBadRequestResponse({
    type: UserNotFoundException,
    example: "User not found"
  })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateUserInput
  ) {
    return new UserView(await this.usersService.update({ id }, data))
  }

  @Patch(':id/status')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle user status' })
  @ApiOkResponse({
    type: UserView,
  })
  @ApiBadRequestResponse({
    type: UserNotFoundException,
    example: "User not found"
  })
  async toggleUserStatus(@Param('id') id: string) {
    return new UserView(await this.usersService.toggleUserStatus(id))
  }

  // @Delete(':id')
  // @UseGuards(JwtAuthGuard, AdminGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Delete a user by id' })
  // @ApiOkResponse({
  //   type: UserView,
  // })
  // @ApiBadRequestResponse({
  //   type: UserNotFoundException,
  //   example: "User not found"
  // })
  // async remove(@Param('id') id: string) {
  //   return new UserView(await this.usersService.remove({ id }))
  // }
}
