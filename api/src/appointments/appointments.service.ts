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
import { endOfDay, startOfDay, subHours } from "date-fns"
import { UpdateAppointmentInput } from "./dto/update-appointment.input"
import { FirebaseService } from "../firebase/firebase.service"
import { ProductsService } from "../products/products.service"
import { EPartnershipDiscountType } from "../partnerships/entities/partnership.entity"

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject("AppointmentSchema") private readonly appointmentSchema: Model<IMongoAppointment>,
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
    private readonly productsService: ProductsService,
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

    //Check if products exists
    for (const productId of dto.productIds || []) {
      await this.productsService.findOne(productId)
    }

    const id = createId()

    let serviceIds: string[] = dto.serviceIds
    let productIds: string[] = dto.productIds || []

    const appointment = new this.appointmentSchema(
      {
        _id: id,
        customerId: customer.id,
        attendantId: dto.attendantId,
        serviceIds,
        productIds,
        totalPrice: 0,
        discount: 0,
        finalPrice: 0,
        status: EAppointmentStatuses.WAITING,
        createdAt: dto.createdAt || new Date(),
      }
    )

    const createdAppointment = await appointment.save()

    createdAppointment.totalPrice = (createdAppointment?.services?.reduce((acc, service) => acc + service.value, 0) || 0) + (createdAppointment?.products?.reduce((acc, product) => acc + product.value, 0) || 0)

    createdAppointment.discount = (createdAppointment?.services?.reduce((acc, service) => acc + (service.promoValue && service.promoEnabled ? (service.value - service.promoValue) : 0), 0) || 0) + (createdAppointment?.products?.reduce((acc, product) => acc + (product.promoValue && product.promoEnabled ? (product.value - product.promoValue) : 0), 0) || 0)

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
      attendantId
    } = filters

    const skip = (page - 1) * limit
    const matchFilters: any = {}

    if (onlyToday) {
      const today = new Date()
      const start = subHours(startOfDay(today), 3)
      const end = subHours(endOfDay(today), 3)
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
          from: 'products',
          localField: 'productIds',
          foreignField: '_id',
          as: 'products',
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

    if (attendantId) {
      pipeline.push({
        $match: {
          attendantId: attendantId,
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
        products: doc.products.map((product) => ({
          ...product,
          id: product._id,
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
      //Check if the appointment has at least one service
      if (!!dto.serviceIds && dto.serviceIds.length === 0) throw new MissingServicesException()

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

      //Check if products exists
      if (dto.productIds) {
        for (const productId of dto.productIds) {
          await this.productsService.findOne(productId)
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

      if (dto.serviceIds || dto.productIds || dto.partnershipIds) {
        updatedAppointment.totalPrice = (updatedAppointment?.services?.reduce((acc, service) => acc + service.value, 0) || 0) + (updatedAppointment?.products?.reduce((acc, product) => acc + product.value, 0) || 0)

        updatedAppointment.discount = (updatedAppointment?.services?.reduce((acc, service) => acc + (service.promoValue && service.promoEnabled ? (service.value - service.promoValue) : 0), 0) || 0) + (updatedAppointment?.products?.reduce((acc, product) => acc + (product.promoValue && product.promoEnabled ? (product.value - product.promoValue) : 0), 0) || 0)

        // Check partnerships fixed discounts
        updatedAppointment.partnerships?.forEach(partnership => {
          if (partnership.discountType === EPartnershipDiscountType.FIXED) {
            updatedAppointment.discount ? updatedAppointment.discount += partnership.discountValue : updatedAppointment.discount = partnership.discountValue
          }
        })

        updatedAppointment.finalPrice = updatedAppointment.totalPrice - (updatedAppointment.discount || 0)

        // Check partnerships percentage discounts
        updatedAppointment.partnerships?.forEach(partnership => {
          if (partnership.discountType === EPartnershipDiscountType.PERCENTAGE) {
            const discountValue = (updatedAppointment.finalPrice * partnership.discountValue) / 100

            updatedAppointment.finalPrice = updatedAppointment.finalPrice - discountValue
            updatedAppointment.discount ? updatedAppointment.discount = updatedAppointment.discount + discountValue : updatedAppointment.discount = discountValue
          }
        })

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
