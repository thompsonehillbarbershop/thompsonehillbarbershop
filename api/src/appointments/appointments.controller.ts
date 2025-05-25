import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode, Put, Query } from '@nestjs/common'
import { AppointmentsService } from './appointments.service'
import { CreateAppointmentInput } from "./dto/create-appointment.input"
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"
import { AppointmentView } from "./dto/appointment.view"
import { UpdateAppointmentInput } from "./dto/update-appointment.input"
import { createPaginatedDto } from "../common/dto/paginated.view"
import { AppointmentQuery } from "./dto/appointment.query"

const PaginatedAppointmentView = createPaginatedDto(AppointmentView)

@ApiTags('Appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new appointment' })
  @ApiBody({ type: CreateAppointmentInput })
  @ApiCreatedResponse({ type: AppointmentView })
  async create(@Body() dto: CreateAppointmentInput) {
    return new AppointmentView(await this.appointmentsService.create(dto))
  }

  @Get()
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a appointment by ID' })
  @ApiOkResponse({ type: AppointmentView })
  @ApiBadRequestResponse({
    description: "Appointment not found",
    schema: {
      example: "Appointment not found"
    }
  })
  async findOne(@Param('id') id: string) {
    return new AppointmentView(await this.appointmentsService.findOne(id))
  }

  @Put(':id')
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

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a appointment by ID' })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({
    description: "Appointment not found",
    schema: {
      example: "Appointment not found"
    }
  })
  async remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id)
  }
}
