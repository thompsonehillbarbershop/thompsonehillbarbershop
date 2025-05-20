import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode } from '@nestjs/common'
import { AppointmentsService } from './appointments.service'
import { CreateAppointmentInput } from "./dto/create-appointment.input"
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "../auth/guards/jwt-auth/jwt-auth.guard"
import { AppointmentView } from "./dto/appointment.view"

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
  @ApiOkResponse({ type: [AppointmentView] })
  async findAll() {
    return (await this.appointmentsService.findAll()).map((appointment) => new AppointmentView(appointment))
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
