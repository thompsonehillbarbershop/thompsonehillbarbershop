import { Inject, Injectable } from '@nestjs/common'
import { Model } from "mongoose"
import { ServiceNotFoundException } from "../errors"
import { IMongoService, toService } from "../mongo/schemas/service.schema"
import { CreateServiceInput } from "./dto/create-service.input"
import { Service } from "./entities/service.entity"
import { createId } from "@paralleldrive/cuid2"
import { UpdateServiceInput } from "./dto/update-service.input"
import { FirebaseService } from "../firebase/firebase.service"

@Injectable()
export class ServicesService {
  constructor(
    @Inject("ServiceSchema") private readonly serviceSchema: Model<IMongoService>,
    private readonly firebaseService: FirebaseService,
  ) { }

  private readonly STORAGE = "services"

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceSchema.findOne({ _id: id })
    if (!service) throw new ServiceNotFoundException()
    return new Service(toService(service))
  }

  async create(dto: CreateServiceInput): Promise<Service> {
    const id = createId()

    const { fileUrl, signedUrl } = await this.firebaseService.createSignedUrl({
      contentType: dto.imageContentType,
      fileName: dto.coverImage,
      folder: this.STORAGE,
      key: id,
    })

    const service = new this.serviceSchema({
      _id: id,
      name: dto.name,
      description: dto.description,
      value: dto.value,
      promoValue: dto.promoValue,
      promoEnabled: dto.promoEnabled,
      coverImage: fileUrl,
      createdAt: new Date(),
    })

    await service.save()

    return new Service({ ...{ ...toService(service) }, signedUrl })
  }

  async findAll(): Promise<Service[]> {
    const services = await this.serviceSchema.find().sort({ name: 1 })
    return services.map((service) => new Service(toService(service)))
  }

  async update(id: string, updateServiceDto: UpdateServiceInput): Promise<Service> {
    const { fileUrl, signedUrl } = await this.firebaseService.createSignedUrl({
      contentType: updateServiceDto.imageContentType,
      fileName: updateServiceDto.coverImage,
      folder: this.STORAGE,
      key: id,
    })

    const service = await this.serviceSchema.findOneAndUpdate(
      { _id: id },
      { ...updateServiceDto, coverImage: fileUrl },
      { new: true }
    )
    if (!service) throw new ServiceNotFoundException()
    return new Service({ ...toService(service), signedUrl })
  }

  async remove(id: string): Promise<Service> {
    const service = await this.serviceSchema.findOneAndDelete({ _id: id })
    if (!service) throw new ServiceNotFoundException()
    return new Service(toService(service))
  }
}

