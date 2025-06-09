export enum EPartnershipType {
  COMMON = 'COMMON',
  PARKING = 'PARKING',
}

export const EPartnershipTypeMapper: Record<EPartnershipType, string> = {
  [EPartnershipType.COMMON]: 'Outros',
  [EPartnershipType.PARKING]: 'Estacionamento',
}

export enum EPartnershipDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export const EPartnershipDiscountTypeMapper: Record<EPartnershipDiscountType, string> = {
  [EPartnershipDiscountType.PERCENTAGE]: 'Porcentagem',
  [EPartnershipDiscountType.FIXED]: 'Valor fixo',
}

export interface IPartnershipView {
  id: string
  name: string
  identificationLabel: string
  type: EPartnershipType
  discountValue: number
  discountType: EPartnershipDiscountType
  createdAt: Date
  deletedAt?: Date
}