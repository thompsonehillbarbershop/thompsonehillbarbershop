import { Schema, Document, Model } from "mongoose"
import { EUserRole, EUserStatus, IUser } from "../../users/entities/user.entity"


export interface IMongoUser extends IUser, Document {
  id: string
}

export const userSchema: Schema<IMongoUser> = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(EUserRole), required: true },
  profileImage: { type: String, required: false },
  status: { type: String, enum: Object.values(EUserStatus), required: true },
}, {
  timestamps: true,
  versionKey: false,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
})

userSchema.virtual('id').get(function () {
  return this._id
})

export function toUser(mongoUser: IMongoUser): IUser {
  return {
    id: mongoUser.id,
    name: mongoUser.name,
    userName: mongoUser.userName,
    password: mongoUser.password,
    role: mongoUser.role,
    profileImage: mongoUser.profileImage,
    status: mongoUser.status,
    createdAt: mongoUser.createdAt,
  }
}