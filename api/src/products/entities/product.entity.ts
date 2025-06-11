
export interface IProduct {
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

export class Product {
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

  constructor(data: IProduct) {
    Object.assign(this, data)
    this.createdAt = new Date(data.createdAt)
    if (data.deletedAt) {
      this.deletedAt = new Date(data.deletedAt)
    }
  }

  toFirebaseObject() {
    return {
      // id: this.id,
      name: this.name,
      // description: this.description || null,
      // value: this.value,
      // promoValue: this.promoValue || null,
      // promoEnabled: this.promoEnabled || false,
      // coverImage: this.coverImage || null,
      // createdAt: this.createdAt.toISOString(),
      // deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    }
  }
}
