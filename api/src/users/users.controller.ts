import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, UseInterceptors, UploadedFile } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserInput } from './dto/create-user.input'
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { UserView } from "./dto/user.view"
import { UpdateUserInput } from "./dto/update-user.input"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"
import { UserNotFoundException } from "../errors"
import { Express } from "express"
import { ProfileImageInterceptor } from "./interceptors/profile-image.interceptor"

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @HttpCode(201)
  // @UseInterceptors(ProfileImageInterceptor)
  @ApiOperation({ summary: 'Register a new user' })
  // @ApiConsumes("multipart/form-data")
  // @ApiBody({ type: CreateUserMultipartInput })
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
  create(
    // @UploadedFile() profileImage: Express.Multer.File,
    @Body() data: CreateUserInput
  ) {
    return this.usersService.create(data)
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({
    type: [UserView],
  })
  findAll() {
    return this.usersService.findAll()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({
    type: UserView,
  })
  @ApiBadRequestResponse({
    type: UserNotFoundException,
    example: "User not found"
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne({ id })
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by id' })
  @ApiOkResponse({
    type: UserView,
  })
  @ApiBadRequestResponse({
    type: UserNotFoundException,
    example: "User not found"
  })
  update(@Param('id') id: string, @Body() data: UpdateUserInput) {
    return this.usersService.update({ id }, data)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by id' })
  @ApiOkResponse({
    type: UserView,
  })
  @ApiBadRequestResponse({
    type: UserNotFoundException,
    example: "User not found"
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove({ id })
  }
}
