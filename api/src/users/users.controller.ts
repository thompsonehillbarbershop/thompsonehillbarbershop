import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserInput } from './dto/create-user.input'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { UserView } from "./dto/user.view"
import { UpdateUserInput } from "./dto/update-user.input"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserInput })
  @ApiResponse({
    status: 201,
    description: 'Created',
    type: UserView,
  })
  create(@Body() data: CreateUserInput) {
    return this.usersService.create(data)
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: [UserView],
  })
  findAll(@Req() req) {
    console.log(req.user.id)

    return this.usersService.findAll()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: UserView,
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne({ id })
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by id' })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: UserView,
  })
  update(@Param('id') id: string, @Body() data: UpdateUserInput) {
    return this.usersService.update({ id }, data)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by id' })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: UserView,
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove({ id })
  }
}
