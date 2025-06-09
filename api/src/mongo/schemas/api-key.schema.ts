import { Schema, Document } from "mongoose"
import { IApiKey } from "../../auth/entities/api-key.entity"


export interface IMongoApiKey extends Document, IApiKey {
  id: string
}

export const apiKeySchema: Schema<IMongoApiKey> = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  key: { type: String, required: true },
  createdAt: { type: Date, default: new Date(), required: false }
}, {
  timestamps: true,
  versionKey: false,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})

apiKeySchema.virtual('id').get(function () {
  return this._id
})

export function toApiKey(mongo: IMongoApiKey): IApiKey {
  return {
    id: mongo.id,
    name: mongo.name,
    key: mongo.key,
    createdAt: mongo.createdAt,
  }
}