import { Test, TestingModule } from "@nestjs/testing"
import { ServicesService } from "./services.service"
import { MongoModule } from "../mongo/mongo.module"
import { ConfigModule } from "@nestjs/config"
import { getRandomServiceCreateInputData } from "./mocks"
import { CreateServiceInput } from "./dto/create-service.input"
import { ServiceNotFoundException } from "../errors"
import { FirebaseModule } from "../firebase/firebase.module"

describe("Services Module", () => {
  let servicesService: ServicesService
  let app: TestingModule

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [ServicesService],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        MongoModule,
        FirebaseModule
      ]
    }).compile()

    servicesService = app.get<ServicesService>(ServicesService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe("ServicesService", () => {
    it("should be defined", () => {
      expect(servicesService).toBeDefined()
    })

    it("should create a service with all fields", async () => {
      const data = getRandomServiceCreateInputData({
        promoValue: 50,
        promoEnabled: true,
        weight: 5,
      })

      const service = await servicesService.create(data)
      expect(service).toBeDefined()
      expect(service.name).toBe(data.name)
      expect(service.description).toBe(data.description)
      expect(service.value).toBe(data.value)
      expect(service.promoValue).toBe(data.promoValue)
      expect(service.promoEnabled).toBe(data.promoEnabled)
      expect(service.weight).toBe(data.weight)
      expect(service.createdAt).toBeDefined()

      await servicesService.remove(service.id)
    })

    it("should create a service with required fields", async () => {
      const data: CreateServiceInput = {
        name: "Test Service",
        value: 100,
        weight: 5,
      }

      const service = await servicesService.create(data)
      expect(service).toBeDefined()
      expect(service.name).toBe(data.name)
      expect(service.description).toBeUndefined()
      expect(service.value).toBe(data.value)
      expect(service.createdAt).toBeDefined()
      expect(service.weight).toBe(data.weight)

      await servicesService.remove(service.id)
    })

    it("should find a service by id", async () => {
      const data = getRandomServiceCreateInputData({
        promoValue: 50,
        promoEnabled: true,
      })

      const service = await servicesService.create(data)
      const foundService = await servicesService.findOne(service.id)

      expect(foundService).toBeDefined()
      expect(foundService.name).toBe(data.name)
      expect(foundService.description).toBe(data.description)
      expect(foundService.value).toBe(data.value)
      expect(foundService.promoValue).toBe(data.promoValue)
      expect(foundService.promoEnabled).toBe(data.promoEnabled)
      expect(foundService.weight).toBe(data.weight)
      expect(foundService.createdAt).toBeDefined()

      await servicesService.remove(service.id)
    })

    it("should not find a service by invalid id", async () => {
      expect(async () => {
        await servicesService.findOne("invalid-id")
      }).rejects.toThrow(ServiceNotFoundException)
    })

    it("should find all services", async () => {
      const initialServices = await servicesService.findAll()
      const inputData = Array.from({ length: 5 }, () => getRandomServiceCreateInputData())

      for (const data of inputData) {
        await servicesService.create(data)
      }

      const services = await servicesService.findAll()
      expect(services).toBeDefined()
      expect(services.length).toBe(initialServices.length + inputData.length)
      expect(services).toEqual(
        expect.arrayContaining(inputData.map((data) => expect.objectContaining({
          name: data.name,
          description: data.description,
          value: data.value,
        })))
      )

      for (const data of inputData) {
        const service = services.find((s) => s.name === data.name)
        if (service) {
          await servicesService.remove(service.id)
        }
      }
    }, 30000)

    it("should not list soft deleted services when find all runs", async () => {
      const initialServices = await servicesService.findAll()
      const inputData = Array.from({ length: 5 }, () => getRandomServiceCreateInputData())
      const inputDataWithDelete = getRandomServiceCreateInputData()

      for (const data of inputData) {
        await servicesService.create(data)

      }

      const services1 = await servicesService.findAll()
      expect(services1.length).toBe(initialServices.length + inputData.length)

      const deleteThisService = await servicesService.create(inputDataWithDelete)
      const services2 = await servicesService.findAll()
      expect(services2.length).toBe(initialServices.length + inputData.length + 1)

      await servicesService.update(deleteThisService.id, {
        delete: true
      })
      const services3 = await servicesService.findAll()
      expect(services3.length).toBe(initialServices.length + inputData.length)

      for (const data of inputData) {
        const service = services1.find((s) => s.name === data.name)
        if (service) {
          await servicesService.remove(service.id)
        }
      }
      await servicesService.remove(deleteThisService.id)
    }, 30000)

    it("should update a service", async () => {
      const data = getRandomServiceCreateInputData()
      const service = await servicesService.create(data)
      const updatedData = getRandomServiceCreateInputData({
        name: "Updated Service",
        description: "Updated Description",
        value: 200,
        promoValue: 100,
        promoEnabled: true,
        weight: 10,
      })

      const updatedService = await servicesService.update(service.id, updatedData)
      expect(updatedService).toBeDefined()
      expect(updatedService.name).toBe(updatedData.name)
      expect(updatedService.description).toBe(updatedData.description)
      expect(updatedService.value).toBe(updatedData.value)
      expect(updatedService.promoValue).toBe(updatedData.promoValue)
      expect(updatedService.promoEnabled).toBe(updatedData.promoEnabled)
      expect(updatedService.weight).toBe(updatedData.weight)
      expect(updatedService.createdAt).toBeDefined()

      const foundService = await servicesService.findOne(service.id)
      expect(foundService).toBeDefined()
      expect(foundService.name).toBe(updatedData.name)
      expect(foundService.description).toBe(updatedData.description)
      expect(foundService.value).toBe(updatedData.value)
      expect(foundService.promoValue).toBe(updatedData.promoValue)
      expect(foundService.promoEnabled).toBe(updatedData.promoEnabled)
      expect(foundService.weight).toBe(updatedData.weight)
      expect(foundService.createdAt).toBeDefined()
    })

    it("should not update a service with invalid id", async () => {
      expect(async () => {
        await servicesService.update("invalid-id", {})
      }).rejects.toThrow(ServiceNotFoundException)
    })

    it("should remove a service", async () => {
      const data = getRandomServiceCreateInputData()
      const service = await servicesService.create(data)

      await servicesService.remove(service.id)

      expect(async () => {
        await servicesService.findOne(service.id)
      }).rejects.toThrow(ServiceNotFoundException)
    })

    it("should not remove a service with invalid id", async () => {
      expect(async () => {
        await servicesService.remove("invalid-id")
      }).rejects.toThrow(ServiceNotFoundException)
    })

    it("should soft delete a service by id", async () => {
      const inputData = getRandomServiceCreateInputData()

      const service = await servicesService.create(inputData)
      const deletedUser = await servicesService.update(service.id, {
        delete: true
      })

      expect(deletedUser).toHaveProperty("id", service.id)
      expect(deletedUser).toHaveProperty("deletedAt")
    })
  })
})