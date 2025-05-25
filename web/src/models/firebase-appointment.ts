import { EAppointmentStatuses } from "./appointment"

export interface IFirebaseAppointment {
  id: string
  status: EAppointmentStatuses
  services: IFirebaseService[]
  redeemCoupon?: null
  totalPrice: number
  finalPrice: number
  finishedAt: null
  attendant?: IFirebaseAttendant | null
  customer: IFirebaseCustomer
  discount?: number
  onServiceAt?: null
  paymentMethod?: null
  createdAt: Date
}

export interface IFirebaseAttendant {
  profileImage?: string
  status?: string
  id?: string
  createdAt?: Date
  name?: string
  role?: string
  userName?: string
}

export interface IFirebaseCreatedAt {
  seconds?: number
  nanoseconds?: number
  date?: Date
}

export interface IFirebaseCustomer {
  id?: string
  phoneNumber?: string
  profileImage?: string
  birthDate?: Date
  createdAt?: Date
  gender?: string
  name?: string
}

export interface IFirebaseService {
  coverImage?: string
  createdAt?: Date
  value?: number
  promoValue?: number
  promoEnabled?: boolean
  name?: string
  id?: string
  description?: null
}
