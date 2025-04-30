import { EUserRole } from "./user"

export interface IAuthView {
  id: string
  userName: string
  userRole: EUserRole
  token: string
}