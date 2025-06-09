import { ApiProperty } from "@nestjs/swagger"
import { Appointment, EAppointmentStatuses, EPaymentMethod } from "../entities/appointment.entity"
import { CustomerView } from "../../customers/dto/customer.view"
import { UserView } from "src/users/dto/user.view"
import { ServiceView } from "src/services/dto/service.view"
import { ProductView } from "src/products/dto/product.view"
import { PartnershipView } from "src/partnerships/dto/partnership.view"

export class AppointmentView {
  constructor(appointment: Appointment) {
    Object.assign(this, appointment)
    this.createdAt = new Date(appointment.createdAt)
    this.onServiceAt = appointment.onServiceAt ? new Date(appointment.onServiceAt) : undefined
    this.finishedAt = appointment.finishedAt ? new Date(appointment.finishedAt) : undefined

    this.customer = new CustomerView(appointment.customer)
    this.attendant = appointment.attendant ? new UserView(appointment.attendant) : undefined
    this.services = appointment.services.map((service) => (new ServiceView(service)))
    this.products = appointment.products.map((product) => (new ProductView(product)))
    this.partnerships = appointment.partnerships ? appointment.partnerships.map((partnership) => (new PartnershipView(partnership))) : undefined
  }

  @ApiProperty()
  id: string

  @ApiProperty({ type: CustomerView })
  customer: CustomerView

  @ApiProperty({ type: UserView })
  attendant?: UserView

  @ApiProperty({ type: [ServiceView] })
  services: ServiceView[]

  @ApiProperty({ type: [ProductView] })
  products: ProductView[]

  @ApiProperty({ type: [PartnershipView] })
  partnerships?: PartnershipView[]

  @ApiProperty()
  totalServiceWeight: number

  @ApiProperty()
  totalPrice: number

  @ApiProperty()
  discount?: number

  @ApiProperty()
  finalPrice: number

  @ApiProperty()
  paymentMethod?: EPaymentMethod

  @ApiProperty()
  redeemCoupon?: string

  @ApiProperty()
  status: EAppointmentStatuses

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  onServiceAt?: Date

  @ApiProperty()
  finishedAt?: Date
}