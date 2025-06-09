import { Schema, Document } from "mongoose"
import { IProduct } from "../../products/entities/product.entity"


export interface IMongoProduct extends IProduct, Document {
  id: string
}

export const productSchema: Schema<IMongoProduct> = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  value: { type: Number, required: true },
  promoValue: { type: Number, required: false },
  promoEnabled: { type: Boolean, required: false, default: false },
  description: { type: String, required: false },
  coverImage: { type: String, required: false },
  deletedAt: { type: Date, required: false, default: null },
}, {
  timestamps: true,
  versionKey: false,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})

productSchema.virtual('id').get(function () {
  return this._id
})

export function toProduct(mongoProduct: IMongoProduct): IProduct {
  return {
    id: mongoProduct.id,
    name: mongoProduct.name,
    description: mongoProduct.description,
    value: mongoProduct.value,
    promoValue: mongoProduct.promoValue,
    promoEnabled: mongoProduct.promoEnabled,
    coverImage: mongoProduct.coverImage,
    createdAt: mongoProduct.createdAt,
    deletedAt: mongoProduct.deletedAt || undefined
  }
}