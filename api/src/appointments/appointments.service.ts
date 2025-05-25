import { Inject, Injectable } from '@nestjs/common'
import { CreateAppointmentInput } from "./dto/create-appointment.input"
import { Appointment, EAppointmentStatuses } from "./entities/appointment.entity"
import { Model } from "mongoose"
import { IMongoAppointment, toAppointment } from "../mongo/schemas/appointment.schema"
import { createId } from "@paralleldrive/cuid2"
import { AppointmentNotFoundException, CustomerNotFoundException, MissingServicesException } from "../errors"
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
        status: EAppointmentStatuses.WAITING,
        createdAt: dto.createdAt || new Date(),
      }
    )

    const createdAppointment = await appointment.save()

    createdAppointment.totalPrice = createdAppointment?.services?.reduce((acc, service) => acc + service.value, 0) || 0
    createdAppointment.discount = createdAppointment?.services?.reduce((acc, service) => acc + (service.promoValue && service.promoEnabled ? (service.value - service.promoValue) : 0), 0)
    createdAppointment.finalPrice = createdAppointment.totalPrice - (createdAppointment.discount || 0)
    await createdAppointment.save()

    const createdAppointmentObj = new Appointment(toAppointment(createdAppointment))

    // Add to queue
    await this.firebaseService.addAppointmentToQueue(createdAppointmentObj)

    return createdAppointmentObj
  }

  async findAll(filters: AppointmentQuery = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      onlyToday,
      customerName,
      status,
      paymentMethod,
    } = filters

    const skip = (page - 1) * limit
    const matchFilters: any = {}

    if (onlyToday) {
      const today = new Date()
      const start = startOfDay(today)
      const end = endOfDay(today)
      matchFilters.createdAt = { $gte: start, $lte: end }
    }

    if (status) matchFilters.status = status
    if (paymentMethod) matchFilters.paymentMethod = paymentMethod

    const pipeline: any[] = [
      { $match: matchFilters },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      { $unwind: '$customer' },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceIds',
          foreignField: '_id',
          as: 'services',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'attendantId',
          foreignField: '_id',
          as: 'attendant',
        },
      },
      { $unwind: { path: '$attendant', preserveNullAndEmptyArrays: true } },
    ]

    if (customerName) {
      pipeline.push({
        $match: {
          'customer.name': { $regex: customerName, $options: 'i' }, // case-insensitive
        },
      })
    }

    pipeline.push(
      { $sort: { [sortBy]: order === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: limit }
    )

    const rawResults = await this.appointmentSchema.aggregate(pipeline).exec()

    const results = rawResults.map((doc) =>
      new Appointment(toAppointment({
        ...doc, id: doc._id,
        customer: {
          ...doc.customer,
          id: doc.customer._id,
        },
        attendant: doc.attendant ? {
          ...doc.attendant,
          id: doc.attendant._id,
        } : undefined,
        services: doc.services.map((service) => ({
          ...service,
          id: service._id,
        })),
      }))
    )

    const countPipeline = pipeline
      .filter(p => !['$skip', '$limit', '$sort'].includes(Object.keys(p)[0]))
      .concat({ $count: 'total' })

    const countResult = await this.appointmentSchema.aggregate(countPipeline).exec()
    const total = countResult[0]?.total || 0

    return {
      results,
      total,
      page,
      limit,
    }
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

        // Check referral code usage
        if (appointment.customer?.id && appointment.customer?.referralCodeUsed) {
          try {
            const customer1 = await this.customersService.findOne({ id: appointment.customer.id })
            const customer2 = await this.customersService.findOne({ referralCode: appointment.customer.referralCodeUsed })

            // Check if the customer has used a referral code and it is first appointment
            if (customer1.referralCodeCount === 0 && customer2) {
              await this.customersService.incrementReferralCodeCount(customer1.id)
              await this.customersService.incrementReferralCodeCount(customer2.id)
            }
          } catch (error) {
            if (error instanceof CustomerNotFoundException) {

            } else {
              throw error
            }
          }
        }
      }

      Object.assign(appointment, {
        ...dto,
        onServiceAt,
        finishedAt,
      })

      const updatedAppointment = await appointment.save()

      if (dto.serviceIds) {
        updatedAppointment.totalPrice = updatedAppointment?.services?.reduce((acc, service) => acc + service.value, 0) || 0
        updatedAppointment.discount = updatedAppointment?.services?.reduce((acc, service) => acc + (service.promoValue && service.promoEnabled ? (service.value - service.promoValue) : 0), 0)
        updatedAppointment.finalPrice = updatedAppointment.totalPrice - (updatedAppointment.discount || 0)
        await updatedAppointment.save()
      }

      const updatedAppointmentObj = new Appointment(toAppointment(updatedAppointment))

      await this.firebaseService.updateAppointment(updatedAppointmentObj)

      return updatedAppointmentObj
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
