export interface IProductView {
  id: string
  name: string
  description?: string
  value: number
  promoValue?: number
  promoEnabled?: boolean
  coverImage?: string
  signedUrl?: string
  createdAt: Date
  deletedAt?: Date
}