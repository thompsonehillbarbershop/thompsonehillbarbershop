import { Schema, Document, Model } from "mongoose"
import { IService } from "../../services/entities/service.entity"


export interface IMongoService extends IService, Document {
  id: string
}

export const serviceSchema: Schema<IMongoService> = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  value: { type: Number, required: true },
  promoValue: { type: Number, required: false },
  promoEnabled: { type: Boolean, required: false, default: false },
  description: { type: String, required: false },
  coverImage: { type: String, required: false },
  deletedAt: { type: Date, required: false, default: null },
  weight: { type: Number, required: true, default: 1 },
}, {
  timestamps: true,
  versionKey: false,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})

serviceSchema.virtual('id').get(function () {
  return this._id
})

export function toService(mongoService: IMongoService): IService {
  return {
    id: mongoService.id,
    name: mongoService.name,
    description: mongoService.description,
    value: mongoService.value,
    promoValue: mongoService.promoValue,
    promoEnabled: mongoService.promoEnabled,
    coverImage: mongoService.coverImage,
    createdAt: mongoService.createdAt,
    deletedAt: mongoService.deletedAt || undefined,
    weight: mongoService.weight,
  }
}