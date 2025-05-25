export interface IUserView {
  id: string
  name: string
  userName: string
  role: EUserRole
  profileImage?: string
  imageSignedUrl?: string
  status: EUserStatus
  createdAt: Date
}

export enum EUserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
}

export enum EUserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  TOTEM = "TOTEM",
  ATTENDANT = "ATTENDANT",
}