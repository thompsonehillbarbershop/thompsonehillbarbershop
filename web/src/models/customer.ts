export interface ICustomerView {
  id: string
  name: string
  phoneNumber: string
  profileImage?: string
  birthDate: Date
  createdAt: Date
  gender: EGender
  signedUrl?: string
  referralCode: string
  referralCodeUsed?: string
  referralCodeCount: number
}

export enum EGender {
  MALE = "MALE",
  FEMALE = "FEMALE"
}

export const EGenderMapper: Record<EGender, string> = {
  [EGender.MALE]: "Masculino",
  [EGender.FEMALE]: "Feminino"
}