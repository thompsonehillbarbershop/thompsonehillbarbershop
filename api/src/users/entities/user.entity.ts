export enum EUserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  TOTEM = "TOTEM",
  ATTENDANT = "ATTENDANT",
  ATTENDANT_MANAGER = "ATTENDANT_MANAGER",
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
  imageSignedUrl?: string
  status: EUserStatus
  createdAt: Date
  deletedAt?: Date | null
}

export class User {
  id: string
  name: string
  userName: string
  password: string
  role: EUserRole
  profileImage?: string
  imageSignedUrl?: string
  status: EUserStatus
  createdAt: Date
  deletedAt?: Date | null

  constructor(data: IUser) {
    Object.assign(this, data)
    this.createdAt = new Date(data.createdAt)
  }

  toFirebaseObject() {
    return {
      id: this.id,
      name: this.name,
      userName: this.userName,
      role: this.role,
      profileImage: this.profileImage || null,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null
    }
  }
}
