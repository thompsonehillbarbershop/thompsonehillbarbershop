import { Test, TestingModule } from "@nestjs/testing"
import { ProductsService } from "./products.service"
import { MongoModule } from "../mongo/mongo.module"
import { ConfigModule } from "@nestjs/config"
import { getRandomProductCreateInputData } from "./mocks"
import { CreateProductInput } from "./dto/create-product.input"
import { ProductNotFoundException } from "../errors"
import { FirebaseModule } from "../firebase/firebase.module"

describe("Services Module", () => {
  let productsService: ProductsService
  let app: TestingModule

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [ProductsService],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        MongoModule,
        FirebaseModule
      ]
    }).compile()

    productsService = app.get<ProductsService>(ProductsService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe("ProductsService", () => {
    it("should be defined", () => {
      expect(productsService).toBeDefined()
    })

    it("should create a product with all fields", async () => {
      const data = getRandomProductCreateInputData({
        promoValue: 50,
        promoEnabled: true
      })

      const product = await productsService.create(data)
      expect(product).toBeDefined()
      expect(product.name).toBe(data.name)
      expect(product.description).toBe(data.description)
      expect(product.value).toBe(data.value)
      expect(product.promoValue).toBe(data.promoValue)
      expect(product.promoEnabled).toBe(data.promoEnabled)
      expect(product.createdAt).toBeDefined()

      await productsService.remove(product.id)
    })

    it("should create a product with required fields", async () => {
      const data: CreateProductInput = {
        name: "Test Product",
        value: 100
      }

      const product = await productsService.create(data)
      expect(product).toBeDefined()
      expect(product.name).toBe(data.name)
      expect(product.description).toBeUndefined()
      expect(product.value).toBe(data.value)
      expect(product.createdAt).toBeDefined()

      await productsService.remove(product.id)
    })

    it("should find a product by id", async () => {
      const data = getRandomProductCreateInputData({
        promoValue: 50,
        promoEnabled: true,
      })

      const product = await productsService.create(data)
      const foundProduct = await productsService.findOne(product.id)

      expect(foundProduct).toBeDefined()
      expect(foundProduct.name).toBe(data.name)
      expect(foundProduct.description).toBe(data.description)
      expect(foundProduct.value).toBe(data.value)
      expect(foundProduct.promoValue).toBe(data.promoValue)
      expect(foundProduct.promoEnabled).toBe(data.promoEnabled)
      expect(foundProduct.createdAt).toBeDefined()

      await productsService.remove(product.id)
    })

    it("should not find a product by invalid id", async () => {
      expect(async () => {
        await productsService.findOne("invalid-id")
      }).rejects.toThrow(ProductNotFoundException)
    })

    it("should find all products", async () => {
      const initialProducts = await productsService.findAll()
      const inputData = Array.from({ length: 5 }, () => getRandomProductCreateInputData())

      for (const data of inputData) {
        await productsService.create(data)
      }

      const products = await productsService.findAll()
      expect(products).toBeDefined()
      expect(products.length).toBe(initialProducts.length + inputData.length)
      expect(products).toEqual(
        expect.arrayContaining(inputData.map((data) => expect.objectContaining({
          name: data.name,
          description: data.description,
          value: data.value,
        })))
      )

      for (const data of inputData) {
        const product = products.find((s) => s.name === data.name)
        if (product) {
          await productsService.remove(product.id)
        }
      }
    }, 30000)

    it("should not list soft deleted products when find all runs", async () => {
      const initialProducts = await productsService.findAll()
      const inputData = Array.from({ length: 5 }, () => getRandomProductCreateInputData())
      const inputDataWithDelete = getRandomProductCreateInputData()

      for (const data of inputData) {
        await productsService.create(data)

      }

      const products1 = await productsService.findAll()
      expect(products1.length).toBe(initialProducts.length + inputData.length)

      const deleteThisService = await productsService.create(inputDataWithDelete)
      const products2 = await productsService.findAll()
      expect(products2.length).toBe(initialProducts.length + inputData.length + 1)

      await productsService.update(deleteThisService.id, {
        delete: true
      })
      const products3 = await productsService.findAll()
      expect(products3.length).toBe(initialProducts.length + inputData.length)

      for (const data of inputData) {
        const product = products1.find((s) => s.name === data.name)
        if (product) {
          await productsService.remove(product.id)
        }
      }
      await productsService.remove(deleteThisService.id)
    }, 30000)

    it("should update a product", async () => {
      const data = getRandomProductCreateInputData()
      const product = await productsService.create(data)
      const updatedData = getRandomProductCreateInputData({
        name: "Updated Product",
        description: "Updated Description",
        value: 200,
        promoValue: 100,
        promoEnabled: true,
      })

      const updatedService = await productsService.update(product.id, updatedData)
      expect(updatedService).toBeDefined()
      expect(updatedService.name).toBe(updatedData.name)
      expect(updatedService.description).toBe(updatedData.description)
      expect(updatedService.value).toBe(updatedData.value)
      expect(updatedService.promoValue).toBe(updatedData.promoValue)
      expect(updatedService.promoEnabled).toBe(updatedData.promoEnabled)
      expect(updatedService.createdAt).toBeDefined()

      const foundProduct = await productsService.findOne(product.id)
      expect(foundProduct).toBeDefined()
      expect(foundProduct.name).toBe(updatedData.name)
      expect(foundProduct.description).toBe(updatedData.description)
      expect(foundProduct.value).toBe(updatedData.value)
      expect(foundProduct.promoValue).toBe(updatedData.promoValue)
      expect(foundProduct.promoEnabled).toBe(updatedData.promoEnabled)
      expect(foundProduct.createdAt).toBeDefined()
    })

    it("should not update a product with invalid id", async () => {
      expect(async () => {
        await productsService.update("invalid-id", {})
      }).rejects.toThrow(ProductNotFoundException)
    })

    it("should remove a product", async () => {
      const data = getRandomProductCreateInputData()
      const product = await productsService.create(data)

      await productsService.remove(product.id)

      expect(async () => {
        await productsService.findOne(product.id)
      }).rejects.toThrow(ProductNotFoundException)
    })

    it("should not remove a product with invalid id", async () => {
      expect(async () => {
        await productsService.remove("invalid-id")
      }).rejects.toThrow(ProductNotFoundException)
    })

    it("should soft delete a product by id", async () => {
      const inputData = getRandomProductCreateInputData()

      const product = await productsService.create(inputData)
      const deletedUser = await productsService.update(product.id, {
        delete: true
      })

      expect(deletedUser).toHaveProperty("id", product.id)
      expect(deletedUser).toHaveProperty("deletedAt")
    })
  })
})