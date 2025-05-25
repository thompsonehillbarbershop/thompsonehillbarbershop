export interface IServiceView {
  id: string
  name: string
  description?: string
  value: number
  promoValue?: number
  promoEnabled?: boolean
  coverImage?: string
  signedUrl?: string
  createdAt: Date
}