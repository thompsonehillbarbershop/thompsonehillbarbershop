
export enum EPartnershipType {
  COMMON = 'COMMON',
  PARKING = 'PARKING',
}

export enum EPartnershipDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export interface IPartnership {
  id: string
  name: string
  identificationLabel: string
  type: EPartnershipType
  discountValue: number
  discountType: EPartnershipDiscountType
  createdAt: Date
  deletedAt?: Date
}

export class Partnership {
  id: string
  name: string
  identificationLabel: string
  type: EPartnershipType
  discountValue: number
  discountType: EPartnershipDiscountType
  createdAt: Date
  deletedAt?: Date

  constructor(data: IPartnership) {
    Object.assign(this, data)
    this.createdAt = new Date(data.createdAt)
    if (data.deletedAt) {
      this.deletedAt = new Date(data.deletedAt)
    }
  }

  toFirebaseObject() {
    return {
      id: this.id,
      name: this.name,
      identificationLabel: this.identificationLabel,
      type: this.type,
      discountValue: this.discountValue,
      discountType: this.discountType,
      createdAt: this.createdAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    }
  }
}
