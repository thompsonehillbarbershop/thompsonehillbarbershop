import { Inject, Injectable } from '@nestjs/common'
import { CreateAppointmentInput } from "./dto/create-appointment.input"
import { Appointment, EAppointmentStatuses, EPaymentMethod } from "./entities/appointment.entity"
import { Model } from "mongoose"
import { IMongoAppointment, IProductItem, IServiceItem, toAppointment } from "../mongo/schemas/appointment.schema"
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
import { EUserRole } from "../users/entities/user.entity"
import { AppointmentSummaryView } from "./dto/appointment-summary.view"
import { Service } from "../services/entities/service.entity"
import { Product } from "../products/entities/product.entity"
import { CUSTOMER_SCHEMA_NAME, PARTNERSHIP_SCHEMA_NAME, PRODUCT_SCHEMA_NAME, SERVICE_SCHEMA_NAME, USER_SCHEMA_NAME } from "../mongo/constants"
import { SummaryBodyInput } from "./dto/summary-body.input"
import { SettingsService } from "../settings/settings.service"

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject("AppointmentSchema") private readonly appointmentSchema: Model<IMongoAppointment>,
    private readonly customersService: CustomersService,
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
    private readonly productsService: ProductsService,
    private readonly firebaseService: FirebaseService,
    private readonly settingService: SettingsService
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
    const foundServices: Service[] = []

    for (const serviceId of dto.serviceIds) {
      const service = await this.servicesService.findOne(serviceId)
      if (service) {
        foundServices.push(service)
      }
    }

    //Check if products exists
    const foundProducts: Product[] = []
    for (const productId of dto.productIds || []) {
      const product = await this.productsService.findOne(productId)
      if (product) {
        foundProducts.push(product)
      }
    }

    const id = createId()

    let serviceIds: IServiceItem[] = foundServices.map(service => ({
      id: service.id,
      price: service.promoEnabled ? service.promoValue || service.value : service.value,
    }))

    let productIds: IProductItem[] = foundProducts.map(product => ({
      id: product.id,
      price: product.promoEnabled ? product.promoValue || product.value : product.value,
    }))

    const appointment = new this.appointmentSchema(
      {
        _id: id,
        customerId: customer.id,
        attendantId: dto.attendantId,
        serviceIds,
        productIds,
        finalServicesPrice: 0,
        finalProductsPrice: 0,
        totalServiceWeight: 0,
        totalPrice: 0,
        discount: 0,
        finalPrice: 0,
        status: EAppointmentStatuses.WAITING,
        createdAt: dto.createdAt || new Date(),
      }
    )

    const createdAppointment = await appointment.save()

    createdAppointment.finalServicesPrice = foundServices.reduce((total, service) => {
      const serviceValue = service.promoEnabled ? (service.promoValue || service.value) : service.value
      return total + serviceValue
    }, 0)

    createdAppointment.finalProductsPrice = foundProducts.reduce((total, product) => total + (product.promoEnabled ? (product.promoValue || product.value) : product.value), 0)

    createdAppointment.totalServiceWeight = foundServices.reduce((total, service) => total + (service.weight || 0), 0)

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
      fromDate,
      toDate,
      customerName,
      status,
      paymentMethod,
      attendantId
    } = filters

    const skip = (page - 1) * limit
    const matchFilters: any = {}

    if (onlyToday) {
      const today = new Date()
      const start = startOfDay(subHours(today, 3))
      const end = endOfDay(subHours(today, 3))
      matchFilters.createdAt = { $gte: start, $lte: end }
    }

    if (fromDate) {
      const date = new Date(fromDate)

      const start = startOfDay(subHours(date, 3))
      const end = endOfDay(subHours(date, 3))

      matchFilters.createdAt = { $gte: start, $lte: end }
    }

    if (fromDate && toDate) {
      const date = new Date(toDate)

      const start = startOfDay(subHours(new Date(fromDate), 3))
      const end = endOfDay(subHours(date, 3))

      matchFilters.createdAt = { $gte: start, $lte: end }
    }

    if (status) matchFilters.status = status
    if (paymentMethod) matchFilters.paymentMethod = paymentMethod

    // console.log('Match Filters:', matchFilters)

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
          localField: 'serviceIds.id',
          foreignField: '_id',
          as: 'services',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productIds.id',
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
      const appointment = await this.appointmentSchema
        .findOne({ _id: id })
        .populate([
          {
            path: 'services',
            model: SERVICE_SCHEMA_NAME,
            localField: 'serviceIds.id',
            foreignField: '_id',
            justOne: false
          },
          {
            path: 'products',
            model: PRODUCT_SCHEMA_NAME,
            localField: 'productIds.id',
            foreignField: '_id',
            justOne: false
          },
          {
            path: 'customer',
            model: CUSTOMER_SCHEMA_NAME
          },
          {
            path: 'attendant',
            model: USER_SCHEMA_NAME
          },
          {
            path: 'partnerships',
            model: PARTNERSHIP_SCHEMA_NAME,
            localField: 'partnershipIds',
            foreignField: '_id',
            justOne: false
          }
        ])

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
      const foundServices: Service[] = []
      if (dto.serviceIds) {
        for (const serviceId of dto.serviceIds) {
          const service = await this.servicesService.findOne(serviceId)
          if (service) {
            foundServices.push(service)
          }
        }
      }

      //Check if products exists
      const foundProducts: Product[] = []
      if (dto.productIds) {
        for (const productId of dto.productIds) {
          const product = await this.productsService.findOne(productId)
          if (product) {
            foundProducts.push(product)
          }
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

      // Update serviceIds and productIds if necessary
      if (dto.serviceIds && dto.productIds) {
        // If both serviceIds and productIds are provided, update both
        Object.assign(appointment, {
          ...dto,
          serviceIds: foundServices.map(service => ({
            id: service.id,
            price: service.promoEnabled ? service.promoValue || service.value : service.value,
          })),
          productIds: foundProducts.map(product => ({
            id: product.id,
            price: product.promoEnabled ? product.promoValue || product.value : product.value,
          })),
          onServiceAt,
          finishedAt,
        })
      } else if (dto.serviceIds) {
        // If only serviceIds are provided, update serviceIds
        Object.assign(appointment, {
          ...dto,
          serviceIds: foundServices.map(service => ({
            id: service.id,
            price: service.promoEnabled ? service.promoValue || service.value : service.value,
          })),
          productIds: appointment.products?.map(product => ({
            id: product.id,
            price: product.value,
          })) || undefined,
          onServiceAt,
          finishedAt,
        })
      } else if (dto.productIds) {
        // If only productIds are provided, update productIds
        Object.assign(appointment, {
          ...dto,
          serviceIds: appointment.services?.map(service => ({
            id: service.id,
            price: service.value,
          })) || undefined,
          productIds: dto.productIds ? foundProducts.map(product => ({
            id: product.id,
            price: product.promoEnabled ? product.promoValue || product.value : product.value,
          })) : undefined,
          onServiceAt,
          finishedAt,
        })
      } else {
        // If neither serviceIds nor productIds are provided, keep existing values
        Object.assign(appointment, {
          ...dto,
          serviceIds: appointment.services?.map(service => ({
            id: service.id,
            price: service.value,
          })),
          productIds: appointment.products?.map(product => ({
            id: product.id,
            price: product.value,
          })),
          onServiceAt,
          finishedAt,
        })
      }

      const updatedAppointment = await appointment.save()

      // If the appointment has no services or products updated, we can skip the price calculations
      if (dto.serviceIds || dto.productIds || dto.partnershipIds) {
        updatedAppointment.finalServicesPrice = (dto.serviceIds ?
          foundServices.reduce((total, service) => total + (service.promoEnabled ? service.promoValue || service.value : service.value), 0) :
          updatedAppointment.services?.reduce((total, service) => total + (service.promoEnabled ? service.promoValue || service.value : service.value), 0)
        ) || 0

        updatedAppointment.finalProductsPrice = (dto.productIds ?
          foundProducts.reduce((total, product) => total + (product.promoEnabled ? product.promoValue || product.value : product.value), 0) :
          updatedAppointment.products?.reduce((total, product) => total + (product.promoEnabled ? product.promoValue || product.value : product.value), 0)) || 0

        updatedAppointment.totalServiceWeight = (dto.serviceIds ?
          foundServices.reduce((total, service) => total + (service.weight || 0), 0) :
          updatedAppointment.services?.reduce((total, service) => total + (service.weight || 0), 0)
        ) || 0

        updatedAppointment.totalPrice = updatedAppointment.finalServicesPrice + updatedAppointment.finalProductsPrice

        updatedAppointment.discount = 0

        updatedAppointment.finalPrice = updatedAppointment.totalPrice

        // Check partnerships fixed discounts
        updatedAppointment.partnerships?.forEach(partnership => {
          if (partnership.discountType === EPartnershipDiscountType.FIXED) {
            updatedAppointment.discount ? updatedAppointment.discount += partnership.discountValue : updatedAppointment.discount = partnership.discountValue
          }
        })

        // Check partnerships percentage discounts
        updatedAppointment.partnerships?.forEach(partnership => {
          if (partnership.discountType === EPartnershipDiscountType.PERCENTAGE) {
            const discountValue = (updatedAppointment.finalPrice * partnership.discountValue) / 100

            updatedAppointment.discount ? updatedAppointment.discount = updatedAppointment.discount + discountValue : updatedAppointment.discount = discountValue
          }
        })

        updatedAppointment.finalPrice = updatedAppointment.finalPrice - updatedAppointment.discount

        await updatedAppointment.save()
      }

      // Calculate payment fee for Debit and Credit Card
      if (updatedAppointment.paymentMethod === EPaymentMethod.DEBIT_CARD || updatedAppointment.paymentMethod === EPaymentMethod.CREDIT_CARD) {
        const settings = await this.settingService.getSettings()

        const paymentFee = (updatedAppointment.paymentMethod === EPaymentMethod.DEBIT_CARD ? settings.debitCardFee : settings.creditCardFee) || 0

        updatedAppointment.paymentFee = paymentFee * updatedAppointment.totalServiceWeight

        updatedAppointment.save()

      } else {
        updatedAppointment.paymentFee = 0
        updatedAppointment.save()
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

  async adminSummary(dto: SummaryBodyInput) {
    const attendants = await this.usersService.findAll({
      role: EUserRole.ATTENDANT,

    })
    const attendantManagers = await this.usersService.findAll({
      role: EUserRole.ATTENDANT_MANAGER
    })

    const allAttendants = [...attendants, ...attendantManagers]
    const summaries: AppointmentSummaryView[] = []

    for (const attendant of allAttendants) {
      const { results } = await this.findAll({
        fromDate: dto.from,
        toDate: dto.to,
        attendantId: attendant.id,
        limit: 1000,
        status: EAppointmentStatuses.FINISHED,
        sortBy: 'createdAt',
        order: 'asc',
      })

      summaries.push(new AppointmentSummaryView(results))
    }

    return summaries
  }
}
