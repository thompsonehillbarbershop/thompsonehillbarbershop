import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode, Put, Query } from '@nestjs/common'
import { CustomersService } from './customers.service'
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"
import { CreateCustomerInput } from "./dto/create-customer.input"
import { CustomerView } from "./dto/customer.view"
import { UpdateCustomerInput } from "./dto/update-customer.input"
import { CustomerQuery } from "./dto/customer.query"
import { createPaginatedDto } from "../common/dto/paginated.view"
import { CombinedAuthGuard } from "../auth/guards/jwt-api-key/jwt-api-key.guard"

const PaginatedCustomersView = createPaginatedDto(CustomerView)

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new customer' })
  @ApiBody({ type: CreateCustomerInput })
  @ApiCreatedResponse({ type: CustomerView })
  @ApiBadRequestResponse({
    description: "Customer not found",
    schema: {
      example: "Customer not found"
    }
  })
  @ApiBadRequestResponse({
    description: "Customer already exists",
    schema: {
      example: "Customer already exists"
    }
  })
  async create(@Body() dto: CreateCustomerInput) {
    return new CustomerView(await this.customersService.create(dto))
  }

  @Get()
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get all customers' })
  @ApiOkResponse({ type: PaginatedCustomersView })
  async findAll(@Query() query: CustomerQuery) {
    const { page = 1, limit = 10 } = query
    const { results, total } = await this.customersService.findAll(query)
    return {
      data: results.map((customer) => new CustomerView(customer)),
      total,
      page,
      limit,
    }
  }

  @Get('/phoneNumber/:phoneNumber')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get a customer by phone number' })
  @ApiOkResponse({ type: CustomerView })
  @ApiBadRequestResponse({
    description: "Customer not found",
    schema: {
      example: "Customer not found"
    }
  })
  async findOneByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    return new CustomerView(await this.customersService.findOne({ phoneNumber }))
  }

  @Get(':id')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiOkResponse({ type: CustomerView })
  @ApiBadRequestResponse({
    description: "Customer not found",
    schema: {
      example: "Customer not found"
    }
  })
  async findOne(@Param('id') id: string) {
    return new CustomerView(await this.customersService.findOne({ id }))
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a customer by ID' })
  @ApiBody({ type: UpdateCustomerInput })
  @ApiOkResponse({ type: CustomerView })
  @ApiBadRequestResponse({
    description: "Customer not found",
    schema: {
      example: "Customer not found"
    }
  })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerInput) {
    return new CustomerView(await this.customersService.update(id, dto))
  }

  // @Delete(':id')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @HttpCode(204)
  // @ApiOperation({ summary: 'Delete a customer by ID' })
  // @ApiNoContentResponse()
  // @ApiBadRequestResponse({
  //   description: "Customer not found",
  //   schema: {
  //     example: "Customer not found"
  //   }
  // })
  // async remove(@Param('id') id: string) {
  //   return this.customersService.remove(id)
  // }
}
