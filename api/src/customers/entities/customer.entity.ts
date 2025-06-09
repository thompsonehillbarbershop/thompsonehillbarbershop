export enum ECustomerGender {
  MALE = "MALE",
  FEMALE = "FEMALE"
}

export interface ICustomer {
  id: string
  name: string
  phoneNumber: string
  profileImage?: string
  signedUrl?: string
  birthDate: Date
  gender: ECustomerGender
  referralCode: string
  referralCodeUsed?: string
  referralCodeCount: number
  partnershipId?: string
  partnershipIdentificationId?: string
  createdAt: Date
}

export class Customer {
  id: string
  name: string
  phoneNumber: string
  profileImage?: string
  signedUrl?: string
  birthDate: Date
  gender: ECustomerGender
  referralCode: string
  referralCodeUsed?: string
  referralCodeCount: number
  partnershipId?: string
  partnershipIdentificationId?: string
  createdAt: Date

  constructor(data: ICustomer) {
    Object.assign(this, data)
    this.createdAt = new Date(data.createdAt)
    this.birthDate = new Date(data.birthDate)
  }

  toFirebaseObject() {
    return {
      id: this.id,
      name: this.name,
      gender: this.gender,
      phoneNumber: this.phoneNumber,
      profileImage: this.profileImage || null,
      referralCode: this.referralCode,
      referralCodeUsed: this.referralCodeUsed || null,
      referralCodeCount: this.referralCodeCount,
      partnershipId: this.partnershipId || null,
      partnershipIdentificationId: this.partnershipIdentificationId || null,
      birthDate: this.birthDate.toISOString(),
      createdAt: this.createdAt.toISOString()
    }
  }
}