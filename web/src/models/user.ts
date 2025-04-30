export interface IUserView {
  id: string
  name: string
  userName: string
  role: EUserRole
  profileImage?: string
  createdAt: Date
}

export enum EUserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  TOTEM = "TOTEM",
  ATTENDANT = "ATTENDANT",
}