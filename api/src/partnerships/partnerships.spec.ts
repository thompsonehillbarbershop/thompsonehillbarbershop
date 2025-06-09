import { Test, TestingModule } from "@nestjs/testing"
import { PartnershipsService } from "./partnerships.service"
import { ConfigModule } from "@nestjs/config"
import { MongoModule } from "../mongo/mongo.module"
import { getRandomPartnershipCreateInputData } from "./mocks"
import { EPartnershipDiscountType, EPartnershipType } from "./entities/partnership.entity"

describe("Partnerships Module", () => {
  let service: PartnershipsService
  let app: TestingModule

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [PartnershipsService],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        MongoModule
      ]
    }).compile()

    service = app.get<PartnershipsService>(PartnershipsService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe("PartnershipsService", () => {
    it("should be defined", () => {
      expect(service).toBeDefined()
    })

    it("should create a partnership with all fields", async () => {
      const data = getRandomPartnershipCreateInputData()

      const partnership = await service.create(data)
      expect(partnership).toBeDefined()
      expect(partnership.name).toBe(data.name)
      expect(partnership.identificationLabel).toBe(data.identificationLabel)
      expect(partnership.type).toBe(data.type)
      expect(partnership.discountValue).toBe(data.discountValue)
      expect(partnership.discountType).toBe(data.discountType)
      expect(partnership.createdAt).toBeDefined()
      expect(partnership.deletedAt).toBeUndefined()


      await service.remove(partnership.id)
    })

    it("should find a partnership by id", async () => {
      const data = getRandomPartnershipCreateInputData()
      const partnership = await service.create(data)

      const foundPartnership = await service.findOne(partnership.id)

      expect(foundPartnership).toBeDefined()
      expect(foundPartnership.id).toBe(partnership.id)
      expect(foundPartnership.name).toBe(data.name)
      expect(foundPartnership.identificationLabel).toBe(data.identificationLabel)
      expect(foundPartnership.type).toBe(data.type)
      expect(foundPartnership.discountValue).toBe(data.discountValue)
      expect(foundPartnership.discountType).toBe(data.discountType)
      expect(foundPartnership.createdAt).toBeDefined()
      expect(foundPartnership.deletedAt).toBeUndefined()

      await service.remove(partnership.id)
    })

    it("should not find a partnership with an invalid id", async () => {
      await expect(service.findOne("invalid-id")).rejects.toThrow("Partnership not found")
    })

    it("should find all partnerships", async () => {
      const data1 = getRandomPartnershipCreateInputData()
      const data2 = getRandomPartnershipCreateInputData()

      const partnership1 = await service.create(data1)
      const partnership2 = await service.create(data2)

      const partnerships = await service.findAll()

      expect(partnerships).toBeDefined()
      expect(partnerships.length).toBeGreaterThanOrEqual(2)

      const foundPartnership1 = partnerships.find(p => p.id === partnership1.id)
      const foundPartnership2 = partnerships.find(p => p.id === partnership2.id)

      expect(foundPartnership1).toBeDefined()
      expect(foundPartnership1!.name).toBe(data1.name)
      expect(foundPartnership1!.identificationLabel).toBe(data1.identificationLabel)
      expect(foundPartnership1!.type).toBe(data1.type)
      expect(foundPartnership1!.discountValue).toBe(data1.discountValue)
      expect(foundPartnership1!.discountType).toBe(data1.discountType)
      expect(foundPartnership1!.createdAt).toBeDefined()
      expect(foundPartnership1!.deletedAt).toBeUndefined()

      expect(foundPartnership2).toBeDefined()
      expect(foundPartnership2!.name).toBe(data2.name)
      expect(foundPartnership2!.identificationLabel).toBe(data2.identificationLabel)
      expect(foundPartnership2!.type).toBe(data2.type)
      expect(foundPartnership2!.discountValue).toBe(data2.discountValue)
      expect(foundPartnership2!.discountType).toBe(data2.discountType)
      expect(foundPartnership2!.createdAt).toBeDefined()
      expect(foundPartnership2!.deletedAt).toBeUndefined()

      await service.remove(partnership1.id)
      await service.remove(partnership2.id)
    })

    it("should not list soft deleted partnerships when find all runs", async () => {
      const actualPartnerships = await service.findAll()

      const data = getRandomPartnershipCreateInputData()
      const data2 = getRandomPartnershipCreateInputData()
      const data3 = getRandomPartnershipCreateInputData()

      const partnership = await service.create(data)
      const partnership2 = await service.create(data2)
      const partnership3 = await service.create(data3)

      const partnerships = await service.findAll()
      expect(partnerships.length).toBe(actualPartnerships.length + 3)

      await service.update(partnership2.id, { delete: true })

      const partnerships2 = await service.findAll()
      expect(partnerships2.length).toBe(actualPartnerships.length + 2)

      await service.remove(partnership.id)
      await service.remove(partnership2.id)
      await service.remove(partnership3.id)
    })

    it("should update a partnership", async () => {
      const data = getRandomPartnershipCreateInputData({
        discountValue: 10,
        discountType: EPartnershipDiscountType.FIXED,
        type: EPartnershipType.COMMON,
        identificationLabel: "InitialLabel",
        name: "Initial Partnership"
      })
      const partnership = await service.create(data)

      const updatedData = {
        name: "Updated Partnership",
        identificationLabel: "UpdatedLabel",
        type: EPartnershipType.PARKING,
        discountValue: 20,
        discountType: EPartnershipDiscountType.PERCENTAGE,
      }

      const updatedPartnership = await service.update(partnership.id, updatedData)

      expect(updatedPartnership).toBeDefined()
      expect(updatedPartnership.id).toBe(partnership.id)
      expect(updatedPartnership.name).toBe(updatedData.name)
      expect(updatedPartnership.identificationLabel).toBe(updatedData.identificationLabel)
      expect(updatedPartnership.type).toBe(updatedData.type)
      expect(updatedPartnership.discountValue).toBe(updatedData.discountValue)
      expect(updatedPartnership.discountType).toBe(updatedData.discountType)
      expect(updatedPartnership.createdAt).toBeDefined()
      expect(updatedPartnership.deletedAt).toBeUndefined()

      const foundPartnership = await service.findOne(partnership.id)

      expect(foundPartnership).toBeDefined()
      expect(foundPartnership.id).toBe(partnership.id)
      expect(foundPartnership.name).toBe(updatedData.name)
      expect(foundPartnership.identificationLabel).toBe(updatedData.identificationLabel)
      expect(foundPartnership.type).toBe(updatedData.type)
      expect(foundPartnership.discountValue).toBe(updatedData.discountValue)
      expect(foundPartnership.discountType).toBe(updatedData.discountType)
      expect(foundPartnership.createdAt).toBeDefined()
      expect(foundPartnership.deletedAt).toBeUndefined()

      await service.remove(partnership.id)
    })

    it("should not update a partnership with an invalid id", async () => {
      await expect(service.update("invalid-id", {})).rejects.toThrow("Partnership not found")
    })

    it("should remove a partnership", async () => {
      const data = getRandomPartnershipCreateInputData()
      const partnership = await service.create(data)

      await service.remove(partnership.id)

      await expect(service.findOne(partnership.id)).rejects.toThrow("Partnership not found")
    })

    it("should not remove a partnership with an invalid id", async () => {
      await expect(service.remove("invalid-id")).rejects.toThrow("Partnership not found")
    })

    it("should soft delete a partnership by id", async () => {
      const inputData = getRandomPartnershipCreateInputData()

      const partnership = await service.create(inputData)
      const deletedPartnership = await service.update(partnership.id, {
        delete: true
      })

      expect(deletedPartnership).toHaveProperty("id", partnership.id)
      expect(deletedPartnership).toHaveProperty("deletedAt")

      const foundPartnership = await service.findOne(partnership.id)
      expect(foundPartnership).toBeDefined()
      expect(foundPartnership.id).toBe(partnership.id)
      expect(foundPartnership.deletedAt).toBeDefined()

      await service.remove(partnership.id)
    })
  })
})