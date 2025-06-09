import { Schema, Document, Model } from "mongoose"
import { Appointment, EAppointmentStatuses, EPaymentMethod } from "../../appointments/entities/appointment.entity"
import { CUSTOMER_SCHEMA_NAME, PARTNERSHIP_SCHEMA_NAME, PRODUCT_SCHEMA_NAME, SERVICE_SCHEMA_NAME, USER_SCHEMA_NAME } from "../constants"
import { IMongoService, toService } from "./service.schema"
import { IMongoCustomer, toCustomer } from "./customer.schema"
import { CustomerNotFoundException } from "../../errors"
import { IMongoUser, toUser } from "./user.schema"
import { IMongoProduct, toProduct } from "./product.schema"
import { IMongoPartnership, toPartnership } from "./partnership.schema"


export interface IMongoAppointment extends Document {
  id: string
  customerId: unknown
  attendantId?: unknown
  serviceIds: unknown
  productIds?: unknown
  partnershipIds?: unknown
  totalPrice: number
  discount?: number
  finalPrice: number
  paymentMethod?: EPaymentMethod
  redeemCoupon?: string
  status: EAppointmentStatuses
  onServiceAt?: Date
  finishedAt?: Date
  createdAt: Date

  // Virtuals
  attendant?: IMongoUser
  services?: IMongoService[]
  products?: IMongoProduct[]
  partnerships?: IMongoPartnership[]
  customer?: IMongoCustomer
}

export const appointmentSchema: Schema<IMongoAppointment> = new Schema({
  _id: { type: String, required: true },
  customerId: { type: String, required: true },
  attendantId: { type: String, required: false },
  serviceIds: { type: [String], required: true },
  productIds: { type: [String], required: false },
  partnershipIds: { type: [String], required: false },
  totalPrice: { type: Number, required: true },
  discount: { type: Number, required: false },
  finalPrice: { type: Number, required: true },
  paymentMethod: { type: String, enum: EPaymentMethod, required: false },
  redeemCoupon: { type: String, required: false },
  status: { type: String, enum: EAppointmentStatuses, required: true },
  onServiceAt: { type: Date, required: false },
  finishedAt: { type: Date, required: false },
}, {
  timestamps: true,
  versionKey: false,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})

appointmentSchema.virtual('id').get(function () {
  return this._id
})

appointmentSchema.virtual('services', { ref: SERVICE_SCHEMA_NAME, localField: "serviceIds", foreignField: "_id" })
appointmentSchema.virtual('products', { ref: PRODUCT_SCHEMA_NAME, localField: "productIds", foreignField: "_id" })
appointmentSchema.virtual('partnerships', { ref: PARTNERSHIP_SCHEMA_NAME, localField: "partnershipIds", foreignField: "_id" })

appointmentSchema.post('save', async function (doc, next) {
  try {
    await doc.populate(['services', 'products', 'customer', 'attendant', 'partnerships'])
    next()
  } catch (err) {
    next(err)
  }
})

appointmentSchema.post('findOne', async function (doc, next) {
  try {
    await doc.populate(['services', 'products', 'customer', 'attendant', 'partnerships'])
    next()
  } catch (err) {
    next(err)
  }
})

appointmentSchema.virtual('customer', {
  ref: CUSTOMER_SCHEMA_NAME,
  localField: "customerId",
  foreignField: "_id",
  justOne: true,
})

appointmentSchema.virtual('attendant', {
  ref: USER_SCHEMA_NAME,
  localField: "attendantId",
  foreignField: "_id",
  justOne: true,
})

export function toAppointment(appointment: IMongoAppointment): Appointment {
  if (!appointment.customer) throw new CustomerNotFoundException()

  return new Appointment({
    id: appointment.id,
    customer: toCustomer(appointment.customer),
    attendant: appointment.attendant ? toUser(appointment.attendant) : undefined,
    services: appointment.services?.map(toService) || [],
    products: appointment.products?.map(toProduct) || [],
    partnerships: appointment.partnerships?.map(toPartnership) || [],
    totalPrice: appointment.totalPrice,
    discount: appointment.discount,
    finalPrice: appointment.finalPrice,
    paymentMethod: appointment.paymentMethod,
    redeemCoupon: appointment.redeemCoupon,
    status: appointment.status,
    createdAt: appointment.createdAt,
    onServiceAt: appointment.onServiceAt,
    finishedAt: appointment.finishedAt
  })
}