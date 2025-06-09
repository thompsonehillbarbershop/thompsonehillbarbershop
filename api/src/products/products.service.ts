import { Inject, Injectable } from '@nestjs/common'
import { Model } from "mongoose"
import { CreateProductInput } from "./dto/create-product.input"
import { Product } from "./entities/product.entity"
import { createId } from "@paralleldrive/cuid2"
import { UpdateProductInput } from "./dto/update-product.input"
import { IMongoProduct, toProduct } from "../mongo/schemas/product.schema"
import { FirebaseService } from "../firebase/firebase.service"
import { ProductNotFoundException } from "../errors"

@Injectable()
export class ProductsService {
  constructor(
    @Inject("ProductSchema") private readonly productSchema: Model<IMongoProduct>,
    private readonly firebaseService: FirebaseService,
  ) { }

  private readonly STORAGE = "products"

  async findOne(id: string): Promise<Product> {
    const product = await this.productSchema.findOne({ _id: id })
    if (!product) throw new ProductNotFoundException()
    return new Product(toProduct(product))
  }

  async create(dto: CreateProductInput): Promise<Product> {
    const id = createId()

    const { fileUrl, signedUrl } = await this.firebaseService.createSignedUrl({
      contentType: dto.imageContentType,
      fileName: dto.coverImage,
      folder: this.STORAGE,
      key: id,
    })

    const product = new this.productSchema({
      _id: id,
      name: dto.name,
      description: dto.description,
      value: dto.value,
      promoValue: dto.promoValue,
      promoEnabled: dto.promoEnabled,
      coverImage: fileUrl,
      createdAt: new Date()
    })

    await product.save()

    return new Product({ ...{ ...toProduct(product) }, signedUrl })
  }

  async findAll(): Promise<Product[]> {
    const products = await this.productSchema.find().sort({ name: 1 })
    return products.filter(product => !product.deletedAt).map((product) => new Product(toProduct(product)))
  }

  async update(id: string, updateProductDto: UpdateProductInput): Promise<Product> {
    const { fileUrl, signedUrl } = await this.firebaseService.createSignedUrl({
      contentType: updateProductDto.imageContentType,
      fileName: updateProductDto.coverImage,
      folder: this.STORAGE,
      key: id,
    })

    const { delete: deleteProduct, ...rest } = updateProductDto

    const product = await this.productSchema.findOneAndUpdate(
      { _id: id },
      {
        ...rest,
        coverImage: fileUrl,
        deletedAt: deleteProduct ? new Date() : undefined
      },
      { new: true }
    )
    if (!product) throw new ProductNotFoundException()
    return new Product({ ...toProduct(product), signedUrl })
  }

  async remove(id: string): Promise<Product> {
    const product = await this.productSchema.findOneAndDelete({ _id: id })
    if (!product) throw new ProductNotFoundException()
    return new Product(toProduct(product))
  }
}

