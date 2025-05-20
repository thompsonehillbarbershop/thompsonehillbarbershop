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

@Injectable()
export class CustomersService {
  constructor(
    @Inject("CustomerSchema") private readonly customerSchema: Model<IMongoCustomer>,
    private readonly firebaseService: FirebaseService,
  ) { }

  private readonly STORAGE = "customers"

  async findOne({ id, phoneNumber }: { id?: string, phoneNumber?: string }): Promise<Customer> {
    const query: any = {}
    if (id) query._id = id
    if (phoneNumber) query.phoneNumber = phoneNumber.toLowerCase().trim()

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
          createdAt: new Date(),
        })

        await customer.save()

        return new Customer({ ...{ ...toCustomer(customer) }, signedUrl })
      } else {
        throw error
      }
    }
  }

  async findAll(): Promise<Customer[]> {
    const customers = await this.customerSchema.find().sort({ name: 1 })
    return customers.map((customer) => new Customer(toCustomer(customer)))
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
}
