export enum EUserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  TOTEM = "TOTEM",
  ATTENDANT = "ATTENDANT",
}

export enum EUserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
}

export interface IUser {
  id: string
  name: string
  userName: string
  password: string
  role: EUserRole
  profileImage?: string
  profileImageSignedUrl?: string
  status: EUserStatus
  createdAt: Date
}

export class User {
  id: string
  name: string
  userName: string
  password: string
  role: EUserRole
  profileImage?: string
  profileImageSignedUrl?: string
  status: EUserStatus
  createdAt: Date

  constructor(data: IUser) {
    Object.assign(this, data)
    this.createdAt = new Date(data.createdAt)
  }
}
