import { IProduct, Product } from "../../products/entities/product.entity"
import { Customer, ICustomer } from "../../customers/entities/customer.entity"
import { IService, Service } from "../../services/entities/service.entity"
import { IUser, User } from "../../users/entities/user.entity"
import { IPartnership, Partnership } from "../../partnerships/entities/partnership.entity"

export enum EPaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  TRANSFER = 'TRANSFER',
  BONUS = 'BONUS',
}

export enum EAppointmentStatuses {
  WAITING = 'WAITING',
  ON_SERVICE = 'ON_SERVICE',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface IAppointment {
  id: string
  customer: ICustomer
  attendant?: IUser
  services: IService[]
  products: IProduct[]
  partnerships?: IPartnership[]
  finalServicesPrice: number
  finalProductsPrice: number
  totalServiceWeight: number
  totalPrice: number
  discount?: number
  finalPrice: number
  paymentMethod?: EPaymentMethod
  paymentFee?: number
  redeemCoupon?: string
  status: EAppointmentStatuses
  createdAt: Date
  onServiceAt?: Date
  finishedAt?: Date
}

export class Appointment {
  id: string
  customer: Customer
  attendant?: User
  services: Service[]
  products: Product[]
  partnerships?: Partnership[]
  finalServicesPrice: number
  finalProductsPrice: number
  totalServiceWeight: number
  totalPrice: number
  discount?: number
  finalPrice: number
  paymentMethod?: EPaymentMethod
  paymentFee?: number
  redeemCoupon?: string
  status: EAppointmentStatuses
  createdAt: Date
  onServiceAt?: Date
  finishedAt?: Date

  constructor(appointment: IAppointment) {
    Object.assign(this, appointment)
    this.createdAt = new Date(appointment.createdAt)
    this.onServiceAt = appointment.onServiceAt ? new Date(appointment.onServiceAt) : undefined
    this.finishedAt = appointment.finishedAt ? new Date(appointment.finishedAt) : undefined

    this.customer = new Customer(appointment.customer)
    this.attendant = appointment.attendant ? new User(appointment.attendant) : undefined
    this.services = appointment.services.map(service => new Service(service))
    this.products = appointment.products.map(product => new Product(product))
    this.partnerships = appointment.partnerships ? appointment.partnerships.map(partnership => new Partnership(partnership)) : undefined
  }

  toFirebaseObject() {
    return {
      id: this.id,
      customer: this.customer.toFirebaseObject(),
      attendant: this.attendant ? this.attendant.toFirebaseObject() : null,
      services: this.services.map(service => service.toFirebaseObject()),
      // products: this.products.map(product => product.toFirebaseObject()),
      // partnerships: this.partnerships ? this.partnerships.map(partnership => partnership.toFirebaseObject()) : null,
      // totalPrice: this.totalPrice,
      // discount: this.discount || 0,
      // finalPrice: this.finalPrice,
      // paymentMethod: this.paymentMethod || null,
      // redeemCoupon: this.redeemCoupon || null,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      onServiceAt: this.onServiceAt ? this.onServiceAt.toISOString() : null,
      // finishedAt: this.finishedAt ? this.finishedAt.toISOString() : null,
    }
  }
}
