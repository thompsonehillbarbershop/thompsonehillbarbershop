import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, Put, Query } from '@nestjs/common'
import { AppointmentsService } from './appointments.service'
import { CreateAppointmentInput } from "./dto/create-appointment.input"
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"
import { AppointmentView } from "./dto/appointment.view"
import { UpdateAppointmentInput } from "./dto/update-appointment.input"
import { createPaginatedDto } from "../common/dto/paginated.view"
import { AppointmentQuery } from "./dto/appointment.query"
import { CombinedAuthGuard } from "../auth/guards/jwt-api-key/jwt-api-key.guard"
import { AppointmentSummaryView } from "./dto/appointment-summary.view"
import { EAppointmentStatuses } from "./entities/appointment.entity"
import { SummaryBodyInput } from "./dto/summary-body.input"

const PaginatedAppointmentView = createPaginatedDto(AppointmentView)

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new appointment' })
  @ApiBody({ type: CreateAppointmentInput })
  @ApiCreatedResponse({ type: AppointmentView })
  async create(@Body() dto: CreateAppointmentInput) {
    return new AppointmentView(await this.appointmentsService.create(dto))
  }

  @Get()
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiOkResponse({ type: PaginatedAppointmentView })
  async findAll(@Query() query: AppointmentQuery) {
    const { page = 1, limit = 10 } = query
    const { results, total } = await this.appointmentsService.findAll(query)

    return {
      data: results.map((appointment) => new AppointmentView(appointment)),
      total,
      page,
      limit,
    }
  }

  @Get("adminSummary")
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get day summary overview' })
  @ApiBody({ type: SummaryBodyInput })
  @ApiOkResponse({ type: [AppointmentSummaryView] })
  async getSummaryAdmin(@Body() dto: SummaryBodyInput) {
    const response = await this.appointmentsService.adminSummary(dto)

    return response
  }

  @Get(':id')
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiOperation({ summary: 'Get a appointment by ID' })
  @ApiOkResponse({ type: AppointmentView })
  @ApiBadRequestResponse({
    description: "Appointment not found",
    schema: {
      example: "Appointment not found"
    }
  })
  async findOne(@Param('id') id: string) {
    const response = new AppointmentView(await this.appointmentsService.findOne(id))
    return response
  }

  @Get("summary/:userId")
  @UseGuards(CombinedAuthGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key for alternative authentication',
    required: false,
  })
  @ApiBody({ type: SummaryBodyInput })
  @ApiOperation({ summary: 'Get day summary overview for a user' })
  @ApiOkResponse({ type: AppointmentSummaryView })
  async getSummary(
    @Param("userId") userId: string,
    @Query() dto: SummaryBodyInput) {

    const { results, total } = await this.appointmentsService.findAll({
      fromDate: dto.from,
      toDate: dto.to,
      attendantId: userId,
      limit: 1000,
      status: EAppointmentStatuses.FINISHED,
      sortBy: 'createdAt',
      order: 'asc',
    })

    return new AppointmentSummaryView(results)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a appointment by ID' })
  @ApiBody({ type: UpdateAppointmentInput })
  @ApiOkResponse({ type: AppointmentView })
  @ApiBadRequestResponse({
    description: "Appointment not found",
    schema: {
      example: "Appointment not found"
    }
  })
  async update(@Param('id') id: string, @Body() dto: UpdateAppointmentInput) {
    return new AppointmentView(await this.appointmentsService.update(id, dto))
  }

  // @Delete(':id')
  // @HttpCode(204)
  // @ApiOperation({ summary: 'Delete a appointment by ID' })
  // @ApiNoContentResponse()
  // @ApiBadRequestResponse({
  //   description: "Appointment not found",
  //   schema: {
  //     example: "Appointment not found"
  //   }
  // })
  // async remove(@Param('id') id: string) {
  //   return this.appointmentsService.remove(id)
  // }
}
