import { Test, TestingModule } from "@nestjs/testing"
import { CustomersService } from "./customers.service"
import { ConfigModule } from "@nestjs/config"
import { MongoModule } from "../mongo/mongo.module"
import { getRandomCustomerCreateInputData } from "./mocks"
import { CustomerAlreadyExistsException, CustomerNotFoundException } from "../errors"
import { UpdateCustomerInput } from "./dto/update-customer.input"
import { CreateCustomerInput } from "./dto/create-customer.input"
import { ECustomerGender } from "./entities/customer.entity"
import { FirebaseModule } from "../firebase/firebase.module"

describe("Customers Module", () => {
  let customersService: CustomersService
  let app: TestingModule

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [CustomersService],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        MongoModule,
        FirebaseModule
      ]
    }).compile()

    customersService = app.get<CustomersService>(CustomersService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe("CustomersService", () => {
    it("should be defined", () => {
      expect(customersService).toBeDefined()
    })

    it("should create a customer with all fields", async () => {
      const data = getRandomCustomerCreateInputData({
        referralCodeUsed: "ABCDEF"
      })

      const customer = await customersService.create(data)
      expect(customer).toBeDefined()
      expect(customer.name).toBe(data.name)
      expect(customer.phoneNumber).toBe(data.phoneNumber)
      expect(customer.birthDate).toEqual(data.birthDate)
      expect(customer.createdAt).toBeDefined()
      expect(customer.gender).toBe(data.gender)
      expect(customer.referralCode).toBeDefined()
      expect(customer.referralCodeCount).toBe(0)
      expect(customer.referralCodeUsed).toBe(data.referralCodeUsed)

      await customersService.remove(customer.id)
    })

    it("should create a customer with required fields", async () => {
      const data: CreateCustomerInput = {
        name: "Test Customer",
        phoneNumber: "1234567890",
        birthDate: new Date("2000-01-01"),
        gender: ECustomerGender.MALE
      }

      const customer = await customersService.create(data)
      expect(customer).toBeDefined()
      expect(customer.name).toBe(data.name)
      expect(customer.phoneNumber).toBe(data.phoneNumber)
      expect(customer.birthDate).toEqual(data.birthDate)
      expect(customer.createdAt).toBeDefined()
      expect(customer.gender).toBe(data.gender)
      expect(customer.referralCode).toBeDefined()
      expect(customer.referralCodeCount).toBe(0)
      expect(customer.referralCodeUsed).toBeUndefined()

      await customersService.remove(customer.id)
    })

    it("should not create a customer with same phone number", async () => {
      const data = getRandomCustomerCreateInputData()
      const createdCustomer = await customersService.create(data)


      expect(async () => {
        await customersService.create(data)
      }).rejects.toThrow(CustomerAlreadyExistsException)

      await customersService.remove(createdCustomer.id)
    })

    it("should find a customer by id", async () => {
      const data = getRandomCustomerCreateInputData({
        referralCodeUsed: "ABCDEF"
      })

      const customer = await customersService.create(data)
      const foundCustomer = await customersService.findOne({ id: customer.id })

      expect(foundCustomer).toBeDefined()
      expect(foundCustomer.name).toBe(data.name)
      expect(foundCustomer.phoneNumber).toBe(data.phoneNumber)
      expect(foundCustomer.birthDate).toEqual(data.birthDate)
      expect(foundCustomer.createdAt).toBeDefined()
      expect(foundCustomer.gender).toBe(data.gender)
      expect(foundCustomer.referralCode).toBeDefined()
      expect(foundCustomer.referralCodeCount).toBe(0)
      expect(foundCustomer.referralCodeUsed).toBe(data.referralCodeUsed)

      await customersService.remove(customer.id)
    })

    it("should find a customer by phone number", async () => {
      const data = getRandomCustomerCreateInputData()

      const customer = await customersService.create(data)
      const foundCustomer = await customersService.findOne({ phoneNumber: customer.phoneNumber })

      expect(foundCustomer).toBeDefined()
      expect(foundCustomer.name).toBe(data.name)
      expect(foundCustomer.phoneNumber).toBe(data.phoneNumber)
      expect(foundCustomer.birthDate).toEqual(data.birthDate)
      expect(foundCustomer.createdAt).toBeDefined()
      expect(customer.gender).toBe(data.gender)
      expect(foundCustomer.referralCode).toBeDefined()
      expect(foundCustomer.referralCodeCount).toBe(0)
      expect(foundCustomer.referralCodeUsed).toBeUndefined()

      await customersService.remove(customer.id)
    })

    it("should find a customer by referralCode", async () => {
      const data = getRandomCustomerCreateInputData()

      const customer = await customersService.create(data)
      const foundCustomer = await customersService.findOne({ referralCode: customer.referralCode })

      expect(foundCustomer).toBeDefined()
      expect(foundCustomer.name).toBe(data.name)
      expect(foundCustomer.phoneNumber).toBe(data.phoneNumber)
      expect(foundCustomer.birthDate).toEqual(data.birthDate)
      expect(foundCustomer.createdAt).toBeDefined()
      expect(customer.gender).toBe(data.gender)
      expect(foundCustomer.referralCode).toBeDefined()
      expect(foundCustomer.referralCodeCount).toBe(0)
      expect(foundCustomer.referralCodeUsed).toBeUndefined()

      await customersService.remove(customer.id)
    })

    it("should not find a customer by invalid id", async () => {
      expect(async () => {
        await customersService.findOne({ id: "invalid-id" })
      }).rejects.toThrow(CustomerNotFoundException)
    })

    it("should not find a customer by invalid phone number", async () => {
      expect(async () => {
        await customersService.findOne({ phoneNumber: "invalid-phone" })
      }).rejects.toThrow(CustomerNotFoundException)
    })

    it("should not find a customer by invalid referralCode", async () => {
      expect(async () => {
        await customersService.findOne({ referralCode: "invalid-code" })
      }).rejects.toThrow(CustomerNotFoundException)
    })

    it("should find all customers", async () => {
      const initialCustomers = await customersService.findAll({ limit: 200 })
      const inputData = Array.from({ length: 5 }, () => getRandomCustomerCreateInputData())

      for (const data of inputData) {
        await customersService.create(data)
      }

      const customers = await customersService.findAll({ limit: 200 })
      expect(customers).toBeDefined()
      expect(customers.results.length).toBe(initialCustomers.results.length + inputData.length)
      expect(customers.results).toEqual(
        expect.arrayContaining(inputData.map((data) => expect.objectContaining({
          name: data.name,
          phoneNumber: data.phoneNumber,
          birthDate: data.birthDate,
        })))
      )

      for (const data of inputData) {
        const customer = customers.results.find((s) => s.name === data.name)
        if (customer) {
          await customersService.remove(customer.id)
        }
      }
    }, 30000)

    it("should update a customer", async () => {
      const data = getRandomCustomerCreateInputData({
        gender: ECustomerGender.MALE
      })

      const customer = await customersService.create(data)
      const updatedData: UpdateCustomerInput = {
        name: "Updated Name",
        birthDate: new Date("1990-01-01"),
        gender: ECustomerGender.FEMALE
      }

      const updatedCustomer = await customersService.update(customer.id, updatedData)

      expect(updatedCustomer).toBeDefined()
      expect(updatedCustomer.name).toBe(updatedData.name)
      expect(updatedCustomer.phoneNumber).toBe(data.phoneNumber)
      expect(updatedCustomer.birthDate).toEqual(updatedData.birthDate)
      expect(updatedCustomer.createdAt).toBeDefined()
      expect(updatedCustomer.gender).toBe(updatedData.gender)

      const foundCustomer = await customersService.findOne({ id: customer.id })
      expect(foundCustomer).toBeDefined()
      expect(foundCustomer.name).toBe(updatedData.name)
      expect(foundCustomer.phoneNumber).toBe(data.phoneNumber)
      expect(foundCustomer.birthDate).toEqual(updatedData.birthDate)
      expect(foundCustomer.createdAt).toBeDefined()
      expect(foundCustomer.gender).toBe(updatedData.gender)

      await customersService.remove(customer.id)
    })

    it("should update a customer phone number if it is not already taken", async () => {
      const data = getRandomCustomerCreateInputData()
      const createdCustomer = await customersService.create(data)

      const newPhoneNumber = "0987654321"
      const updatedCustomer = await customersService.update(createdCustomer.id, { phoneNumber: newPhoneNumber })

      expect(updatedCustomer).toBeDefined()
      expect(updatedCustomer.phoneNumber).toBe(newPhoneNumber)

      const foundCustomer = await customersService.findOne({ id: createdCustomer.id })
      expect(foundCustomer).toBeDefined()
      expect(foundCustomer.phoneNumber).toBe(newPhoneNumber)
      expect(foundCustomer.name).toBe(data.name)

      await customersService.remove(createdCustomer.id)
    })

    it("should update a customer phone number if it already belong to customer", async () => {
      const data = getRandomCustomerCreateInputData()
      const createdCustomer = await customersService.create(data)

      const updatedCustomer = await customersService.update(createdCustomer.id, { phoneNumber: data.phoneNumber })

      expect(updatedCustomer).toBeDefined()
      expect(updatedCustomer.phoneNumber).toBe(data.phoneNumber)

      const foundCustomer = await customersService.findOne({ id: createdCustomer.id })
      expect(foundCustomer).toBeDefined()
      expect(foundCustomer.phoneNumber).toBe(data.phoneNumber)
      expect(foundCustomer.name).toBe(data.name)

      await customersService.remove(createdCustomer.id)
    })

    it("should not update a customer phone number if it is already taken", async () => {
      const data1 = getRandomCustomerCreateInputData()
      const data2 = getRandomCustomerCreateInputData()

      const createdCustomer1 = await customersService.create(data1)
      const createdCustomer2 = await customersService.create(data2)

      const updatedData: UpdateCustomerInput = {
        phoneNumber: data1.phoneNumber
      }
      expect(async () => {
        await customersService.update(createdCustomer2.id, updatedData)
      }
      ).rejects.toThrow(CustomerAlreadyExistsException)
    })

    it("should not update a customer with invalid id", async () => {
      expect(async () => {
        await customersService.update("invalid-id", { name: "New Name" })
      }).rejects.toThrow(CustomerNotFoundException)
    })

    it("should remove a customer", async () => {
      const data = getRandomCustomerCreateInputData()
      const customer = await customersService.create(data)

      await customersService.remove(customer.id)

      expect(async () => {
        await customersService.findOne({ id: customer.id })
      }).rejects.toThrow(CustomerNotFoundException)
    })

    it("should not remove a customer with invalid id", async () => {
      expect(async () => {
        await customersService.remove("invalid-id")
      }).rejects.toThrow(CustomerNotFoundException)
    })

    it("should increment a customer referralCodeCount", async () => {
      const data = getRandomCustomerCreateInputData()

      const customer = await customersService.create(data)
      expect(customer).toBeDefined()
      expect(customer.name).toBe(data.name)
      expect(customer.phoneNumber).toBe(data.phoneNumber)
      expect(customer.birthDate).toEqual(data.birthDate)
      expect(customer.createdAt).toBeDefined()
      expect(customer.gender).toBe(data.gender)
      expect(customer.referralCodeCount).toBe(0)

      const updatedCustomer = await customersService.incrementReferralCodeCount(customer.id)
      expect(updatedCustomer).toBeDefined()
      expect(updatedCustomer.referralCodeCount).toBe(1)

      for (let i = 0; i < 5; i++) {
        await customersService.incrementReferralCodeCount(customer.id)
      }

      const foundCustomer = await customersService.findOne({ id: customer.id })
      expect(foundCustomer).toBeDefined()
      expect(foundCustomer.referralCodeCount).toBe(6)

      await customersService.remove(customer.id)
    })
  })
})