import { Inject, Injectable } from '@nestjs/common'
import { Model } from "mongoose"
import { CreatePartnershipInput } from "./dto/create-partnership.input"
import { Partnership } from "./entities/partnership.entity"
import { createId } from "@paralleldrive/cuid2"
import { UpdatePartnershipInput } from "./dto/update-partnership.input"
import { PartnershipNotFoundException } from "../errors"
import { IMongoPartnership, toPartnership } from "../mongo/schemas/partnership.schema"

@Injectable()
export class PartnershipsService {
  constructor(
    @Inject("PartnershipSchema") private readonly partnershipSchema: Model<IMongoPartnership>,
  ) { }

  private readonly STORAGE = "partnerships"

  async findOne(id: string): Promise<Partnership> {
    const partnership = await this.partnershipSchema.findOne({ _id: id })
    if (!partnership) throw new PartnershipNotFoundException()
    return new Partnership(toPartnership(partnership))
  }

  async create(dto: CreatePartnershipInput): Promise<Partnership> {
    const id = createId()

    const partnership = new this.partnershipSchema({
      _id: id,
      name: dto.name,
      identificationLabel: dto.identificationLabel,
      type: dto.type,
      discountValue: dto.discountValue,
      discountType: dto.discountType
    })

    await partnership.save()

    return new Partnership({ ...toPartnership(partnership) })
  }

  async findAll(): Promise<Partnership[]> {
    const partnerships = await this.partnershipSchema.find().sort({ name: 1 })
    return partnerships.filter(partnership => !partnership.deletedAt).map((partnership) => new Partnership(toPartnership(partnership)))
  }

  async update(id: string, updatePartnershipDto: UpdatePartnershipInput): Promise<Partnership> {
    const { delete: deletePartnership, ...rest } = updatePartnershipDto

    const partnership = await this.partnershipSchema.findOneAndUpdate(
      { _id: id },
      {
        ...rest,
        deletedAt: deletePartnership ? new Date() : undefined
      },
      { new: true }
    )
    if (!partnership) throw new PartnershipNotFoundException()
    return new Partnership({ ...toPartnership(partnership) })
  }

  async remove(id: string): Promise<Partnership> {
    const partnership = await this.partnershipSchema.findOneAndDelete({ _id: id })
    if (!partnership) throw new PartnershipNotFoundException()
    return new Partnership(toPartnership(partnership))
  }
}

