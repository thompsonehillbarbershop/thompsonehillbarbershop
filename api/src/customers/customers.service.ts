import { Inject, Injectable } from '@nestjs/common'
import { Model } from "mongoose"
import { IMongoCustomer, toCustomer } from "../mongo/schemas/customer.schema"
import { CustomerAlreadyExistsException, CustomerNotFoundException } from "../errors"
import { Customer } from "./entities/customer.entity"
import { CreateCustomerInput } from "./dto/create-customer.input"
import { createId } from "@paralleldrive/cuid2"
import { UpdateCustomerInput } from "./dto/update-customer.input"
import { capitalizeName } from "../utils"
import { FirebaseService } from "../firebase/firebase.service"
import { CustomerQuery } from "./dto/customer.query"

@Injectable()
export class CustomersService {
  constructor(
    @Inject("CustomerSchema") private readonly customerSchema: Model<IMongoCustomer>,
    private readonly firebaseService: FirebaseService,
  ) { }

  private readonly STORAGE = "customers"

  async findOne({ id, phoneNumber, referralCode }: { id?: string, phoneNumber?: string, referralCode?: string }): Promise<Customer> {
    const query: any = {}
    if (id) query._id = id
    if (phoneNumber) query.phoneNumber = phoneNumber.toLowerCase().trim()
    if (referralCode) query.referralCode = referralCode.toUpperCase().trim()

    const customer = await this.customerSchema.findOne(query)
    if (!customer) throw new CustomerNotFoundException
    return new Customer(toCustomer(customer))
  }

  async create(dto: CreateCustomerInput): Promise<Customer> {
    try {
      await this.findOne({ phoneNumber: dto.phoneNumber })
      throw new CustomerAlreadyExistsException()
    } catch (error) {
      if (error instanceof CustomerNotFoundException) {
        const id = createId()

        const { fileUrl, signedUrl } = await this.firebaseService.createSignedUrl({
          contentType: dto.imageContentType,
          fileName: dto.profileImage,
          folder: this.STORAGE,
          key: id,
        })

        const customer = new this.customerSchema({
          _id: id,
          name: capitalizeName(dto.name),
          phoneNumber: dto.phoneNumber,
          profileImage: fileUrl,
          birthDate: dto.birthDate,
          gender: dto.gender,
          referralCode: generateRandomReferralCode(),
          referralCodeUsed: dto.referralCodeUsed,
          referralCodeCount: 0,
          createdAt: new Date(),
        })

        await customer.save()

        return new Customer({ ...{ ...toCustomer(customer) }, signedUrl })
      } else {
        throw error
      }
    }
  }

  async findAll(
    filters: CustomerQuery = {}
  ) {
    const {
      name,
      phoneNumber,
      referralCode,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      ...otherFilters
    } = filters

    const filterFields: any = {
      ...otherFilters,
    }
    if (name) filterFields.name = { $regex: name, $options: 'i' }
    if (phoneNumber) filterFields.phoneNumber = { $regex: phoneNumber, $options: 'i' }
    if (referralCode) filterFields.referralCode = referralCode

    const skip = (page - 1) * limit

    const query = this.customerSchema
      .find(filterFields)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)

    const [results, total] = await Promise.all([
      query.exec(),
      this.customerSchema.countDocuments(filterFields),
    ])

    return {
      results: results.map((customer) => new Customer(toCustomer(customer))),
      total,
    }
  }

  async update(id: string, dto: UpdateCustomerInput): Promise<Customer> {
    try {
      const { fileUrl, signedUrl } = await this.firebaseService.createSignedUrl({
        contentType: dto.imageContentType,
        fileName: dto.profileImage,
        folder: this.STORAGE,
        key: id,
      })

      const customer = await this.customerSchema.findOneAndUpdate(
        { _id: id },
        { ...dto, profileImage: fileUrl },
        { new: true }
      )

      if (!customer) throw new CustomerNotFoundException()
      return new Customer({ ...toCustomer(customer), signedUrl })
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate key error")) {
        throw new CustomerAlreadyExistsException()
      } else {
        throw error
      }
    }
  }

  async remove(id: string): Promise<Customer> {
    const customer = await this.customerSchema.findOneAndDelete({ _id: id })
    if (!customer) throw new CustomerNotFoundException()
    return new Customer(toCustomer(customer))
  }

  async incrementReferralCodeCount(id: string): Promise<Customer> {
    try {
      const customer = await this.customerSchema.findOneAndUpdate(
        { _id: id },
        { $inc: { referralCodeCount: 1 } },
        { new: true }
      )

      if (!customer) {
        throw new CustomerNotFoundException()
      }

      return new Customer({ ...toCustomer(customer) })

    } catch (error) {
      throw error
    }
  }
}

function generateRandomReferralCode(length: number = 6): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < length; i++) {
    const indice = Math.floor(Math.random() * letters.length)
    code += letters[indice]
  }
  return code
}
