import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode, Put } from '@nestjs/common'
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"
import { AdminGuard } from "../users/guards/is-admin.guard"
import { CreateProductInput } from "./dto/create-product.input"
import { ProductView } from "./dto/product.view"
import { ProductsService } from "./products.service"
import { UpdateProductInput } from "./dto/update-product.input"
import { CombinedAuthGuard } from "../auth/guards/jwt-api-key/jwt-api-key.guard"

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new product' })
  @ApiBody({ type: CreateProductInput })
  @ApiCreatedResponse({ type: ProductView })
  @ApiBadRequestResponse({
    description: "Product not found",
    schema: {
      example: "Product not found"
    }
  })
  async create(@Body() createProductDto: CreateProductInput) {
    return new ProductView(await this.productsService.create(createProductDto))
  }

  @Get()
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ type: [ProductView] })
  async findAll() {
    return (await this.productsService.findAll()).map(product => new ProductView(product))
  }

  @Get(':id')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiOkResponse({ type: ProductView })
  @ApiBadRequestResponse({
    description: "Product not found",
    schema: {
      example: "Product not found"
    }
  })
  async findOne(@Param('id') id: string) {
    return new ProductView(await this.productsService.findOne(id))
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product by ID' })
  @ApiBody({ type: UpdateProductInput })
  @ApiOkResponse({ type: ProductView })
  @ApiBadRequestResponse({
    description: "Product not found",
    schema: {
      example: "Product not found"
    }
  })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductInput) {
    return this.productsService.update(id, updateProductDto)
  }

  // @Delete(':id')
  // @UseGuards(JwtAuthGuard, AdminGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Delete a product by ID' })
  // @ApiNoContentResponse()
  // @ApiBadRequestResponse({
  //   description: "Product not found",
  //   schema: {
  //     example: "Product not found"
  //   }
  // })
  // remove(@Param('id') id: string) {
  //   return this.productsService.remove(id)
  // }
}
