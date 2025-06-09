import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, Put } from '@nestjs/common'
import { ServicesService } from './services.service'
import { CreateServiceInput } from "./dto/create-service.input"
import { UpdateServiceInput } from "./dto/update-service.input"
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"
import { AdminGuard } from "../users/guards/is-admin.guard"
import { ServiceView } from "./dto/service.view"
import { CombinedAuthGuard } from "../auth/guards/jwt-api-key/jwt-api-key.guard"

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new service' })
  @ApiBody({ type: CreateServiceInput })
  @ApiCreatedResponse({ type: ServiceView })
  @ApiBadRequestResponse({
    description: "Service not found",
    schema: {
      example: "Service not found"
    }
  })
  async create(@Body() createServiceDto: CreateServiceInput) {
    return new ServiceView(await this.servicesService.create(createServiceDto))
  }

  @Get()
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get all services' })
  @ApiOkResponse({ type: [ServiceView] })
  async findAll() {
    return (await this.servicesService.findAll()).map(service => new ServiceView(service))
  }

  @Get(':id')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiOkResponse({ type: ServiceView })
  @ApiBadRequestResponse({
    description: "Service not found",
    schema: {
      example: "Service not found"
    }
  })
  async findOne(@Param('id') id: string) {
    return new ServiceView(await this.servicesService.findOne(id))
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service by ID' })
  @ApiBody({ type: UpdateServiceInput })
  @ApiOkResponse({ type: ServiceView })
  @ApiBadRequestResponse({
    description: "Service not found",
    schema: {
      example: "Service not found"
    }
  })
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceInput) {
    return this.servicesService.update(id, updateServiceDto)
  }

  // @Delete(':id')
  // @UseGuards(JwtAuthGuard, AdminGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Delete a service by ID' })
  // @ApiNoContentResponse()
  // @ApiBadRequestResponse({
  //   description: "Service not found",
  //   schema: {
  //     example: "Service not found"
  //   }
  // })
  // remove(@Param('id') id: string) {
  //   return this.servicesService.remove(id)
  // }
}
