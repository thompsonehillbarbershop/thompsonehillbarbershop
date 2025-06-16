import { ICustomerView } from "./customer"
import { IPartnershipView } from "./partnerships"
import { IProductView } from "./product"
import { IServiceView } from "./service"
import { IUserView } from "./user"

export enum EPaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  TRANSFER = 'TRANSFER',
  // BONUS = 'BONUS',
}

export enum EAppointmentStatuses {
  WAITING = 'WAITING',
  ON_SERVICE = 'ON_SERVICE',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

type EAppointmentStatusesMapperType = {
  label: string,
  bgColor: string,
  textColor: string
}

export const EAppointmentStatusesMapper: Record<EAppointmentStatuses, EAppointmentStatusesMapperType> = {
  [EAppointmentStatuses.WAITING]: {
    label: 'Aguardando',
    bgColor: '#FFD580',
    textColor: '#1E1E1E',
  },
  [EAppointmentStatuses.ON_SERVICE]: {
    label: 'Atendendo',
    bgColor: '#80C7FF',
    textColor: '#1E1E1E',
  },
  [EAppointmentStatuses.FINISHED]: {
    label: 'Finalizado',
    bgColor: '#A8E6CF',
    textColor: '#1E1E1E',
  },
  [EAppointmentStatuses.CANCELLED]: {
    label: 'Cancelado',
    bgColor: '#FF8A80',
    textColor: '#1E1E1E',
  },
  [EAppointmentStatuses.NO_SHOW]: {
    label: 'Ausente',
    bgColor: '#D1C4E9',
    textColor: '#1E1E1E',
  },
}

export const EPaymentMethodMapper: Record<EPaymentMethod, string> = {
  [EPaymentMethod.CASH]: 'Dinheiro',
  [EPaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [EPaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [EPaymentMethod.PIX]: 'Pix',
  [EPaymentMethod.TRANSFER]: 'Transferência',
  // [EPaymentMethod.BONUS]: 'Bônus',
}

export interface IAppointmentView {
  id: string
  customer: ICustomerView
  attendant?: IUserView
  services: IServiceView[]
  products: IProductView[],
  partnerships?: IPartnershipView[]
  totalServiceWeight: number
  totalPrice: number
  discount?: number
  finalPrice: number
  paymentMethod: EPaymentMethod
  paymentFee?: number
  redeemCoupon?: string
  status: EAppointmentStatuses
  createdAt: Date
  onServiceAt?: Date
  finishedAt?: Date
}