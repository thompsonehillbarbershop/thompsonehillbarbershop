import { Inject, Injectable } from '@nestjs/common'
import { CreateAppointmentInput } from "./dto/create-appointment.input"
import { Appointment, EAppointmentStatuses } from "./entities/appointment.entity"
import { Model } from "mongoose"
import { IMongoAppointment, toAppointment } from "../mongo/schemas/appointment.schema"
import { createId } from "@paralleldrive/cuid2"
import { AppointmentNotFoundException, MissingServicesException } from "../errors"
import { CustomersService } from "../customers/customers.service"
import { UsersService } from "../users/users.service"
import { ServicesService } from "../services/services.service"
import { AppointmentQuery } from "./dto/appointment.query"
import { endOfDay, startOfDay } from "date-fns"
import { UpdateAppointmentInput } from "./dto/update-appointment.input"
import { FirebaseService } from "../firebase/firebase.service"

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject("AppointmentSchema") private readonly appointmentSchema: Model<IMongoAppointment>,
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
    private readonly firebaseService: FirebaseService
  ) { }

  async create(dto: CreateAppointmentInput): Promise<Appointment> {

    //Check if the appointment has at least one service
    if (!dto.serviceIds || dto.serviceIds.length === 0) throw new MissingServicesException()

    //Check if the customer exists
    const customer = await this.customersService.findOne({ id: dto.customerId })

    //Check if attendant exists
    if (!!dto.attendantId) {
      await this.usersService.findOne({ id: dto.attendantId })
    }

    //Check if services exists
    for (const serviceId of dto.serviceIds) {
      await this.servicesService.findOne(serviceId)
    }

    const id = createId()

    let serviceIds: string[] = dto.serviceIds

    const appointment = new this.appointmentSchema(
      {
        _id: id,
        customerId: customer.id,
        attendantId: dto.attendantId,
        serviceIds,
        totalPrice: 0,
        discount: 0,
        finalPrice: 0,
        status: EAppointmentStatuses.WAITING
      }
    )

    const createdAppointment = await appointment.save()

    createdAppointment.totalPrice = createdAppointment?.services?.reduce((acc, service) => acc + service.value, 0) || 0
    createdAppointment.finalPrice = createdAppointment.totalPrice - (createdAppointment.discount || 0)
    await createdAppointment.save()

    const createdAppointmentObj = new Appointment(toAppointment(createdAppointment))

    // Add to queue
    await this.firebaseService.addAppointmentToQueue(createdAppointmentObj)

    return createdAppointmentObj
  }

  async findAll(query?: AppointmentQuery): Promise<Appointment[]> {
    const dbQuery: any = {}

    if (query?.onlyToday) {
      const today = new Date()
      const start = startOfDay(today)
      const end = endOfDay(today)

      dbQuery.createdAt = { $gte: start, $lte: end }
    }

    const appointments = await this.appointmentSchema
      .find(dbQuery)
      .populate(['services', 'customer', 'attendant'])
      .sort({ createdAt: -1 })

    return appointments.map(toAppointment)
  }

  async findOne(id: string): Promise<Appointment> {
    try {
      const appointment = await this.appointmentSchema.findOne({ _id: id })
      if (!appointment) throw new AppointmentNotFoundException()

      return toAppointment(appointment)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Cannot read properties of null')) {
        throw new AppointmentNotFoundException()
      }

      console.error('Error finding appointment:', error)
      throw error
    }
  }

  async update(id: string, dto: UpdateAppointmentInput): Promise<Appointment> {
    try {
      const appointment = await this.appointmentSchema.findOne({ _id: id })
      if (!appointment) throw new AppointmentNotFoundException()

      let onServiceAt: Date | undefined = appointment.onServiceAt
      let finishedAt: Date | undefined = appointment.finishedAt

      //Check if attendant exists
      if (!!dto.attendantId) {
        await this.usersService.findOne({ id: dto.attendantId })
      }

      //Check if services exists
      if (dto.serviceIds) {
        for (const serviceId of dto.serviceIds) {
          await this.servicesService.findOne(serviceId)
        }
      }

      //Set the appointment status to ON_SERVICE if the appointment is being updated to ON_SERVICE
      if (dto.status === EAppointmentStatuses.ON_SERVICE) {
        onServiceAt = new Date()
        appointment.status = EAppointmentStatuses.ON_SERVICE
      }

      //Set the appointment status to FINISHED if the appointment is being updated to FINISHED
      if (dto.status === EAppointmentStatuses.FINISHED) {
        finishedAt = new Date()
        appointment.status = EAppointmentStatuses.FINISHED
      }

      Object.assign(appointment, {
        ...dto,
        onServiceAt,
        finishedAt,
      })

      const updatedAppointment = await appointment.save()

      if (dto.serviceIds) {
        updatedAppointment.totalPrice = updatedAppointment?.services?.reduce((acc, service) => acc + service.value, 0) || 0
        updatedAppointment.finalPrice = updatedAppointment.totalPrice - (updatedAppointment.discount || 0)
        await updatedAppointment.save()
      }

      return toAppointment(updatedAppointment)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Cannot read properties of null')) {
        throw new AppointmentNotFoundException()
      }

      console.error('Error updating appointment:', error)
      throw error
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const appointment = await this.appointmentSchema.findOneAndDelete({ _id: id })
      if (!appointment) throw new AppointmentNotFoundException()
      return
    } catch (error) {
      if (error instanceof TypeError) {
        throw new AppointmentNotFoundException()
      }

      console.error('Error deleting appointment:', error)
      throw error
    }
  }
}
