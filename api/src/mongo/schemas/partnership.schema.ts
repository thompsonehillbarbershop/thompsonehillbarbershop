import { Schema, Document } from "mongoose"
import { EPartnershipDiscountType, EPartnershipType, IPartnership } from "../../partnerships/entities/partnership.entity"


export interface IMongoPartnership extends IPartnership, Document {
  id: string
}

export const partnershipSchema: Schema<IMongoPartnership> = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  identificationLabel: { type: String, required: true },
  type: { type: String, required: true, enum: EPartnershipType },
  discountValue: { type: Number, required: true },
  discountType: { type: String, required: true, enum: EPartnershipDiscountType },
  deletedAt: { type: Date, required: false, default: null },
}, {
  timestamps: true,
  versionKey: false,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})

partnershipSchema.virtual('id').get(function () {
  return this._id
})

export function toPartnership(mongoPartnership: IMongoPartnership): IPartnership {
  return {
    id: mongoPartnership.id,
    name: mongoPartnership.name,
    identificationLabel: mongoPartnership.identificationLabel,
    type: mongoPartnership.type,
    discountValue: mongoPartnership.discountValue,
    discountType: mongoPartnership.discountType,
    createdAt: mongoPartnership.createdAt,
    deletedAt: mongoPartnership.deletedAt || undefined
  }
}