import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode, Put } from '@nestjs/common'
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"
import { AdminGuard } from "../users/guards/is-admin.guard"
import { CreatePartnershipInput } from "./dto/create-partnership.input"
import { PartnershipView } from "./dto/partnership.view"
import { PartnershipsService } from "./partnerships.service"
import { UpdatePartnershipInput } from "./dto/update-partnership.input"
import { CombinedAuthGuard } from "../auth/guards/jwt-api-key/jwt-api-key.guard"

@ApiTags('Partnerships')
@Controller('partnerships')
export class PartnershipsController {
  constructor(private readonly partnershipsService: PartnershipsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new partnership' })
  @ApiBody({ type: CreatePartnershipInput })
  @ApiCreatedResponse({ type: PartnershipView })
  @ApiBadRequestResponse({
    description: "Partnership not found",
    schema: {
      example: "Partnership not found"
    }
  })
  async create(@Body() createPartnershipDto: CreatePartnershipInput) {
    return new PartnershipView(await this.partnershipsService.create(createPartnershipDto))
  }

  @Get()
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get all partnerships' })
  @ApiOkResponse({ type: [PartnershipView] })
  async findAll() {
    return (await this.partnershipsService.findAll()).map(partnership => new PartnershipView(partnership))
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a partnership by ID' })
  @ApiOkResponse({ type: PartnershipView })
  @ApiBadRequestResponse({
    description: "Partnership not found",
    schema: {
      example: "Partnership not found"
    }
  })
  async findOne(@Param('id') id: string) {
    return new PartnershipView(await this.partnershipsService.findOne(id))
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a partnership by ID' })
  @ApiBody({ type: UpdatePartnershipInput })
  @ApiOkResponse({ type: PartnershipView })
  @ApiBadRequestResponse({
    description: "Partnership not found",
    schema: {
      example: "Partnership not found"
    }
  })
  update(@Param('id') id: string, @Body() updatePartnershipDto: UpdatePartnershipInput) {
    return this.partnershipsService.update(id, updatePartnershipDto)
  }

  // @Delete(':id')
  // @UseGuards(JwtAuthGuard)
  // @UseGuards(JwtAuthGuard, AdminGuard)
  // @ApiOperation({ summary: 'Delete a partnership by ID' })
  // @ApiNoContentResponse()
  // @ApiBadRequestResponse({
  //   description: "Partnership not found",
  //   schema: {
  //     example: "Partnership not found"
  //   }
  // })
  // remove(@Param('id') id: string) {
  //   return this.partnershipsService.remove(id)
  // }
}
