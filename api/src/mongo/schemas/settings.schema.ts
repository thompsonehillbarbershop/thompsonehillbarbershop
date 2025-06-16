import { Schema, Document } from "mongoose"
import { ISetting } from "../../settings/entities/setting.entity"

export interface IMongoSetting extends Document, ISetting {
  id: string
}

export const settingSchema: Schema<IMongoSetting> = new Schema({
  _id: { type: String, required: true },
  creditCardFee: { type: Number, required: false, default: 0 },
  debitCardFee: { type: Number, required: false, default: 0 },
}, {
  timestamps: true,
  versionKey: false,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})

settingSchema.virtual('id').get(function () {
  return this._id
})

export function toSettings(mongo: IMongoSetting): ISetting {
  return {
    id: mongo.id,
    creditCardFee: mongo.creditCardFee || 0,
    debitCardFee: mongo.debitCardFee || 0,
  }
}