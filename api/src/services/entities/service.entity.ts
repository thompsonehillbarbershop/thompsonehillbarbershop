
export interface IService {
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

export class Service {
  id: string
  name: string
  description?: string
  value: number
  promoValue?: number
  promoEnabled?: boolean
  coverImage?: string
  signedUrl?: string
  createdAt: Date

  constructor(data: IService) {
    Object.assign(this, data)
    this.createdAt = new Date(data.createdAt)
  }

  toFirebaseObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description || null,
      value: this.value,
      promoValue: this.promoValue || null,
      promoEnabled: this.promoEnabled || false,
      coverImage: this.coverImage || null,
      createdAt: this.createdAt.toISOString()
    }
  }
}
