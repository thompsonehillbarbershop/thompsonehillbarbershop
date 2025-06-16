import { Schema, Document, Model } from "mongoose"
import { Appointment, EAppointmentStatuses, EPaymentMethod } from "../../appointments/entities/appointment.entity"
import { CUSTOMER_SCHEMA_NAME, PARTNERSHIP_SCHEMA_NAME, PRODUCT_SCHEMA_NAME, SERVICE_SCHEMA_NAME, USER_SCHEMA_NAME } from "../constants"
import { IMongoService, toService } from "./service.schema"
import { IMongoCustomer, toCustomer } from "./customer.schema"
import { CustomerNotFoundException } from "../../errors"
import { IMongoUser, toUser } from "./user.schema"
import { IMongoProduct, toProduct } from "./product.schema"
import { IMongoPartnership, toPartnership } from "./partnership.schema"

export interface IServiceItem {
  id: string
  price: number
}

export interface IProductItem {
  id: string
  price: number
}

export interface IMongoAppointment extends Document {
  id: string
  customerId: unknown
  attendantId?: unknown
  serviceIds: IServiceItem[]
  productIds?: IProductItem[]
  partnershipIds?: unknown
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
  serviceIds: [{
    id: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  productIds: [{
    id: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  partnershipIds: { type: [String], required: false },
  finalServicesPrice: { type: Number, required: true },
  finalProductsPrice: { type: Number, required: true },
  totalServiceWeight: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  discount: { type: Number, required: false },
  finalPrice: { type: Number, required: true },
  paymentMethod: { type: String, enum: EPaymentMethod, required: false },
  paymentFee: { type: Number, required: false, default: 0 },
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

appointmentSchema.virtual('services', {
  ref: SERVICE_SCHEMA_NAME,
  localField: "serviceIds.id",
  foreignField: "_id",
})
appointmentSchema.virtual('products', {
  ref: PRODUCT_SCHEMA_NAME,
  localField: "productIds.id",
  foreignField: "_id",
})
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
  if (!doc) return next()

  try {
    await doc
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

    services: (appointment.services || []).map(service => {
      const item = appointment.serviceIds.find(s => s.id === service.id)
      return {
        ...toService(service),
        price: item?.price ?? 0
      }
    }),

    products: (appointment.products || []).map(product => {
      const item = appointment.productIds?.find(p => p.id === product.id)
      return {
        ...toProduct(product),
        price: item?.price ?? 0
      }
    }),

    partnerships: appointment.partnerships?.map(toPartnership) || [],
    finalServicesPrice: appointment.finalServicesPrice,
    finalProductsPrice: appointment.finalProductsPrice,
    totalServiceWeight: appointment.totalServiceWeight,
    totalPrice: appointment.totalPrice,
    discount: appointment.discount,
    finalPrice: appointment.finalPrice,
    paymentMethod: appointment.paymentMethod,
    paymentFee: appointment.paymentFee,
    redeemCoupon: appointment.redeemCoupon,
    status: appointment.status,
    createdAt: appointment.createdAt,
    onServiceAt: appointment.onServiceAt,
    finishedAt: appointment.finishedAt
  })
}
