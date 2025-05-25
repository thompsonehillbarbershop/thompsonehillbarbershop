import { Schema, Document, Model } from "mongoose"
import { ECustomerGender, ICustomer } from "../../customers/entities/customer.entity"

export interface IMongoCustomer extends ICustomer, Document {
  id: string
}

export const customerSchema: Schema<IMongoCustomer> = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  profileImage: { type: String, required: false },
  birthDate: { type: Date, required: true },
  gender: { type: String, enum: Object.values(ECustomerGender), required: true },
  referralCode: { type: String, required: true, unique: true },
  referralCodeUsed: { type: String, required: false },
  referralCodeCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  versionKey: false,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})

customerSchema.virtual('id').get(function () {
  return this._id
})

export function toCustomer(mongoCustomer: IMongoCustomer): ICustomer {
  return {
    id: mongoCustomer.id,
    name: mongoCustomer.name,
    phoneNumber: mongoCustomer.phoneNumber,
    profileImage: mongoCustomer.profileImage,
    gender: mongoCustomer.gender,
    birthDate: mongoCustomer.birthDate,
    createdAt: mongoCustomer.createdAt,
    referralCode: mongoCustomer.referralCode,
    referralCodeUsed: mongoCustomer.referralCodeUsed,
    referralCodeCount: mongoCustomer.referralCodeCount,
  }
}