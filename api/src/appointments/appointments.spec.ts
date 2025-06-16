import { Test, TestingModule } from "@nestjs/testing"
import { AppointmentsService } from "./appointments.service"
import { ConfigModule } from "@nestjs/config"
import { MongoModule } from "../mongo/mongo.module"
import { UsersService } from "../users/users.service"
import { CustomersService } from "../customers/customers.service"
import { UsersModule } from "../users/users.module"
import { CustomersModule } from "../customers/customers.module"
import { getRandomUserData } from "../users/mocks"
import { getRandomCustomerCreateInputData } from "../customers/mocks"
import { ServicesService } from "../services/services.service"
import { ServicesModule } from "../services/services.module"
import { getRandomServiceCreateInputData } from "../services/mocks"
import { Appointment, EAppointmentStatuses, EPaymentMethod, IAppointment } from "./entities/appointment.entity"
import { AppointmentNotFoundException, CustomerNotFoundException, MissingServicesException, ProductNotFoundException, ServiceNotFoundException, UserNotFoundException } from "../errors"
import { FirebaseModule } from "../firebase/firebase.module"
import { UpdateServiceInput } from "../services/dto/update-service.input"
import { ProductsService } from "../products/products.service"
import { ProductsModule } from "../products/products.module"
import { getRandomProductCreateInputData } from "../products/mocks"
import { PartnershipsModule } from "../partnerships/partnerships.module"
import { PartnershipsService } from "../partnerships/partnerships.service"
import { getRandomPartnershipCreateInputData } from "../partnerships/mocks"
import { EPartnershipDiscountType, EPartnershipType } from "../partnerships/entities/partnership.entity"
import { subDays } from "date-fns"
import { faker } from "@faker-js/faker/."
import { AppointmentSummaryView } from "./dto/appointment-summary.view"
import { SettingsModule } from "../settings/settings.module"
import { SettingsService } from "../settings/settings.service"

describe("Appointment Module", () => {
  let appointmentsService: AppointmentsService
  let usersService: UsersService
  let servicesService: ServicesService
  let productsService: ProductsService
  let customersService: CustomersService
  let partnershipsService: PartnershipsService
  let settingService: SettingsService
  let app: TestingModule

  const CREDIT_CARD_FEE = 1.73
  const DEBIT_CARD_FEE = 1.28

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [AppointmentsService],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        MongoModule,
        FirebaseModule,
        UsersModule,
        ServicesModule,
        ProductsModule,
        CustomersModule,
        SettingsModule,
        PartnershipsModule
      ]
    }).compile()

    appointmentsService = app.get<AppointmentsService>(AppointmentsService)
    usersService = app.get<UsersService>(UsersService)
    customersService = app.get<CustomersService>(CustomersService)
    servicesService = app.get<ServicesService>(ServicesService)
    productsService = app.get<ProductsService>(ProductsService)
    partnershipsService = app.get<PartnershipsService>(PartnershipsService)
    settingService = app.get<SettingsService>(SettingsService)

    await settingService.updateSettings({
      creditCardFee: CREDIT_CARD_FEE,
      debitCardFee: DEBIT_CARD_FEE
    })
  })

  afterAll(async () => {
    await app.close()
  })

  describe("AppointmentsService", () => {
    it("should be defined", () => {
      expect(usersService).toBeDefined()
      expect(servicesService).toBeDefined()
      expect(productsService).toBeDefined()
      expect(customersService).toBeDefined()
      expect(appointmentsService).toBeDefined()
      expect(partnershipsService).toBeDefined()
    })

    it("should create an appointment with a customer, attendant and one service and one product", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const product1 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id],
        productIds: [product1.id]
      })

      expect(appointment).toBeDefined()
      expect(appointment.customer.id).toBe(customer.id)
      expect(appointment.customer.name).toBe(customer.name)
      expect(appointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(appointment.attendant?.id).toBe(attendant.id)
      expect(appointment.attendant?.name).toBe(attendant.name)
      expect(appointment.services).toHaveLength(1)
      expect(appointment.products).toHaveLength(1)
      expect(appointment.services[0].id).toBe(service1.id)
      expect(appointment.products[0].id).toBe(product1.id)
      expect(appointment.finalServicesPrice).toBe(service1.value)
      expect(appointment.finalProductsPrice).toBe(product1.value)
      expect(appointment.totalServiceWeight).toBe(service1.weight || 0)
      expect(appointment.totalPrice).toBe(service1.value + product1.value)
      expect(appointment.finalPrice).toBe(service1.value + product1.value)
      expect(appointment.discount).toBe(0)
      expect(appointment.status).toBe(EAppointmentStatuses.WAITING)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await productsService.remove(product1.id)
      await servicesService.remove(service1.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should create an appointment with a customer, attendant tree services, and tree products", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())

      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())
      const product3 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id, product3.id]
      })

      expect(appointment).toBeDefined()
      expect(appointment.customer.id).toBe(customer.id)
      expect(appointment.customer.name).toBe(customer.name)
      expect(appointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(appointment.attendant?.id).toBe(attendant.id)
      expect(appointment.attendant?.name).toBe(attendant.name)
      expect(appointment.services).toHaveLength(3)
      expect(appointment.products).toHaveLength(3)
      expect(appointment.services[0].id).toBe(service1.id)
      expect(appointment.services[1].id).toBe(service2.id)
      expect(appointment.services[2].id).toBe(service3.id)
      expect(appointment.products[0].id).toBe(product1.id)
      expect(appointment.products[1].id).toBe(product2.id)
      expect(appointment.products[2].id).toBe(product3.id)
      expect(appointment.finalServicesPrice).toBe(
        service1.value + service2.value + service3.value
      )
      expect(appointment.finalProductsPrice).toBe(
        product1.value + product2.value + product3.value
      )
      expect(appointment.totalServiceWeight).toBe(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(appointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value + product3.value
      )
      expect(appointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value + product3.value
      )
      expect(appointment.discount).toBe(0)
      expect(appointment.status).toBe(EAppointmentStatuses.WAITING)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await productsService.remove(product3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should create an appointment with a customer, one service and no attendant", async () => {
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        serviceIds: [service1.id]
      })

      expect(appointment).toBeDefined()
      expect(appointment.customer.id).toBe(customer.id)
      expect(appointment.customer.name).toBe(customer.name)
      expect(appointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(appointment.attendant).toBeUndefined()
      expect(appointment.services).toHaveLength(1)
      expect(appointment.products).toHaveLength(0)
      expect(appointment.services[0].id).toBe(service1.id)
      expect(appointment.finalServicesPrice).toBe(service1.value)
      expect(appointment.finalProductsPrice).toBe(0)
      expect(appointment.totalServiceWeight).toBe(service1.weight || 0)
      expect(appointment.totalPrice).toBeCloseTo(service1.value)
      expect(appointment.finalPrice).toBeCloseTo(service1.value)
      expect(appointment.discount).toBe(0)
      expect(appointment.status).toBe(EAppointmentStatuses.WAITING)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
    })

    it("should not create an appointment without services", async () => {
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const product1 = await productsService.create(getRandomProductCreateInputData())

      await expect(appointmentsService.create({
        customerId: customer.id,
        serviceIds: [],
        productIds: [product1.id]
      })).rejects.toThrow(MissingServicesException)

      await customersService.remove(customer.id)
      await productsService.remove(product1.id)
    })

    it("should not create an appointment with a invalid customer", async () => {
      const attendant = await usersService.create(getRandomUserData())

      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const product1 = await productsService.create(getRandomProductCreateInputData())

      try {
        await appointmentsService.create({
          customerId: "invalid-customer-id",
          attendantId: attendant.id,
          serviceIds: [service1.id],
          productIds: [product1.id]
        })
        fail("Expected CustomerNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(CustomerNotFoundException)
      }

      await servicesService.remove(service1.id)
      await productsService.remove(product1.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not create an appointment with a invalid attendant", async () => {
      const customer = await customersService.create(getRandomCustomerCreateInputData())

      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const product1 = await productsService.create(getRandomProductCreateInputData())

      try {
        await appointmentsService.create({
          customerId: customer.id,
          attendantId: "invalid-attendant-id",
          serviceIds: [service1.id],
          productIds: [product1.id]
        })
        fail("Expected CustomerNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(UserNotFoundException)
      }

      await servicesService.remove(service1.id)
      await productsService.remove(product1.id)
      await customersService.remove(customer.id)
    })

    it("should not create an appointment with a invalid service", async () => {
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const attendant = await usersService.create(getRandomUserData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const product1 = await productsService.create(getRandomProductCreateInputData())

      try {
        await appointmentsService.create({
          customerId: customer.id,
          attendantId: attendant.id,
          serviceIds: [service1.id, "invalid-service-id"],
          productIds: [product1.id]
        })
        fail("Expected ServiceNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceNotFoundException)
      }
      await servicesService.remove(service1.id)
      await customersService.remove(customer.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not create an appointment with a invalid product", async () => {
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const attendant = await usersService.create(getRandomUserData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const product1 = await productsService.create(getRandomProductCreateInputData())

      try {
        await appointmentsService.create({
          customerId: customer.id,
          attendantId: attendant.id,
          serviceIds: [service1.id],
          productIds: [product1.id, "invalid-product-id"]
        })
        fail("Expected ProductNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(ProductNotFoundException)
      }
      await servicesService.remove(service1.id)
      await productsService.remove(product1.id)
      await customersService.remove(customer.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should get an appointment", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())
      const product3 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id, product3.id]
      })

      const foundAppointment = await appointmentsService.findOne(appointment.id)

      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service3.id)
      expect(foundAppointment.products).toHaveLength(3)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product2.id)
      expect(foundAppointment.products[2].id).toBe(product3.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value + product3.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value + product3.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value + product3.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      await appointmentsService.remove(foundAppointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await productsService.remove(product3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not get an appointment with a invalid id", async () => {
      try {
        await appointmentsService.findOne("invalid-appointment-id")
        fail("Expected AppointmentNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(AppointmentNotFoundException)
      }
    })

    it.skip("should get all appointments", async () => {
      const currentAppointments = await appointmentsService.findAll()

      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())

      const appointment1 = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const appointment2 = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const appointments = await appointmentsService.findAll()

      expect(appointments.results).toBeDefined()
      expect(appointments.total).toBe(currentAppointments.total + 2)

      const foundAppointment1 = appointments.results.find(a => a.id === appointment1.id)
      const foundAppointment2 = appointments.results.find(a => a.id === appointment2.id)

      expect(foundAppointment1).toBeDefined()
      expect(foundAppointment1!.customer.id).toBe(customer.id)
      expect(foundAppointment1!.customer.name).toBe(customer.name)
      expect(foundAppointment1!.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment1!.attendant?.id).toBe(attendant.id)
      expect(foundAppointment1!.attendant?.name).toBe(attendant.name)
      expect(foundAppointment1!.services).toHaveLength(3)
      expect(foundAppointment1!.products).toHaveLength(0)
      expect(foundAppointment1!.services[0].id).toBe(service1.id)
      expect(foundAppointment1!.services[1].id).toBe(service2.id)
      expect(foundAppointment1!.services[2].id).toBe(service3.id)
      expect(foundAppointment1!.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(foundAppointment1!.finalProductsPrice).toBe(0)
      expect(foundAppointment1!.totalServiceWeight).toBe(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment1!.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment1!.finalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment1!.discount).toBe(0)
      expect(foundAppointment1!.status).toBe(EAppointmentStatuses.WAITING)

      expect(foundAppointment2).toBeDefined()
      expect(foundAppointment2!.customer.id).toBe(customer.id)
      expect(foundAppointment2!.customer.name).toBe(customer.name)
      expect(foundAppointment2!.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment2!.attendant?.id).toBe(attendant.id)
      expect(foundAppointment2!.attendant?.name).toBe(attendant.name)
      expect(foundAppointment2!.services).toHaveLength(3)
      expect(foundAppointment2!.products).toHaveLength(2)
      expect(foundAppointment2!.services[0].id).toBe(service1.id)
      expect(foundAppointment2!.services[1].id).toBe(service2.id)
      expect(foundAppointment2!.services[2].id).toBe(service3.id)
      expect(foundAppointment2!.products[0].id).toBe(product1.id)
      expect(foundAppointment2!.products[1].id).toBe(product2.id)
      expect(foundAppointment2!.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(foundAppointment2!.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(foundAppointment2!.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment2!.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment2!.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment2!.discount).toBe(0)
      expect(foundAppointment2!.status).toBe(EAppointmentStatuses.WAITING)

      await appointmentsService.remove(appointment1.id)
      await appointmentsService.remove(appointment2.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should get all appointments from current date", async () => {
      const currentAppointments = await appointmentsService.findAll({ onlyToday: true })

      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const appointment1 = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        createdAt: subDays(new Date(), 2)
      })

      const appointment2 = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        createdAt: subDays(new Date(), 2)
      })

      const appointment3 = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const appointment4 = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const appointment5 = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        createdAt: subDays(new Date(), 2)
      })

      const appointments = await appointmentsService.findAll({ onlyToday: true })

      expect(appointments.results).toBeDefined()
      expect(appointments.total).toBe(currentAppointments.total + 2)

      await appointmentsService.remove(appointment1.id)
      await appointmentsService.remove(appointment2.id)
      await appointmentsService.remove(appointment3.id)
      await appointmentsService.remove(appointment4.id)
      await appointmentsService.remove(appointment5.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment attendant", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const attendant2 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        attendantId: attendant2.id
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant2.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant2.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service3.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product2.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(updatedAppointment.paymentFee).toBe(0)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant2.id)
      expect(foundAppointment.attendant?.name).toBe(attendant2.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service3.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product2.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(foundAppointment.paymentFee).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant1.id })
      await usersService.remove({ id: attendant2.id })
    })

    it("should not update an appointment with a invalid attendant", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())
      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })
      try {
        await appointmentsService.update(appointment.id, {
          attendantId: "invalid-attendant-id"
        })
        fail("Expected UserNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(UserNotFoundException)
      }

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment only services and recalculate the total prices", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({ value: 99.99 }))
      const service4 = await servicesService.create(getRandomServiceCreateInputData({ value: 49.99 }))

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        serviceIds: [service1.id, service2.id, service4.id]
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service4.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product2.id)

      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service4.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(updatedAppointment.paymentFee).toBe(0)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service4.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product2.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service4.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product2.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product2.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(foundAppointment.paymentFee).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await servicesService.remove(service4.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment only products and recalculate the total prices", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData({ value: 49.99 }))
      const product2 = await productsService.create(getRandomProductCreateInputData({ value: 14.99 }))
      const product3 = await productsService.create(getRandomProductCreateInputData({ value: 29.99 }))
      const product4 = await productsService.create(getRandomProductCreateInputData({ value: 19.99 }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        productIds: [product1.id, product3.id, product4.id]
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(2)
      expect(updatedAppointment.products).toHaveLength(3)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product3.id)
      expect(updatedAppointment.products[2].id).toBe(product4.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product3.value + product4.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value +
        product1.value + product3.value + product4.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value +
        product1.value + product3.value + product4.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(updatedAppointment.paymentFee).toBe(0)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(2)
      expect(foundAppointment.products).toHaveLength(3)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product3.id)
      expect(foundAppointment.products[2].id).toBe(product4.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product3.value + product4.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value +
        product1.value + product3.value + product4.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value +
        product1.value + product3.value + product4.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(foundAppointment.paymentFee).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await productsService.remove(product3.id)
      await productsService.remove(product4.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment services and products and recalculate the total prices", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({ value: 99.99 }))
      const service4 = await servicesService.create(getRandomServiceCreateInputData({ value: 49.99 }))

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData({ value: 19.99 }))
      const product3 = await productsService.create(getRandomProductCreateInputData({ value: 29.99 }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        serviceIds: [service1.id, service2.id, service4.id],
        productIds: [product1.id, product3.id]
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service4.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product3.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product3.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service4.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product3.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product3.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(updatedAppointment.paymentFee).toBe(0)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service4.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product3.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product3.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service4.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product3.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product3.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(foundAppointment.paymentFee).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await servicesService.remove(service4.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment adding products and recalculate the total prices", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({ value: 99.99 }))
      const service4 = await servicesService.create(getRandomServiceCreateInputData({ value: 49.99 }))

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData({ value: 19.99 }))
      const product3 = await productsService.create(getRandomProductCreateInputData({ value: 29.99 }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        serviceIds: [service1.id, service2.id, service4.id],
        productIds: [product1.id, product3.id]
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service4.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product3.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product3.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service4.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product3.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product3.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(updatedAppointment.paymentFee).toBe(0)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service4.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product3.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product3.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service4.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product3.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product3.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(foundAppointment.paymentFee).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await servicesService.remove(service4.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment, removing all products and recalculate the total prices", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({ value: 99.99 }))
      const service4 = await servicesService.create(getRandomServiceCreateInputData({ value: 49.99 }))

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData({ value: 19.99 }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        serviceIds: [service1.id, service2.id, service4.id],
        productIds: []
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(0)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service4.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(updatedAppointment.finalProductsPrice).toBe(0)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service4.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(updatedAppointment.paymentFee).toBe(0)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(0)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service4.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(foundAppointment.finalProductsPrice).toBe(0)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service4.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(foundAppointment.paymentFee).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await servicesService.remove(service4.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment, keeping all products and recalculate the total prices", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({ value: 99.99 }))
      const service4 = await servicesService.create(getRandomServiceCreateInputData({ value: 49.99 }))

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData({ value: 19.99 }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        serviceIds: [service1.id, service2.id, service4.id]
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service4.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product2.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service4.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(updatedAppointment.paymentFee).toBe(0)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service4.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product2.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service4.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product2.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service4.value +
        product1.value + product2.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      expect(foundAppointment.paymentFee).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await servicesService.remove(service4.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not update an appointment with an invalid service", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      try {
        await appointmentsService.update(appointment.id, {
          serviceIds: [service1.id, service2.id, "invalid-service-id"]
        })
        fail("Expected ServiceNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceNotFoundException)
      }

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not update an appointment with an invalid product", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      try {
        await appointmentsService.update(appointment.id, {
          productIds: [product1.id, product2.id, "invalid-product-id"]
        })
        fail("Expected ProductNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(ProductNotFoundException)
      }

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment payment method to PIX", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        paymentMethod: EPaymentMethod.PIX
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service3.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product2.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(updatedAppointment.paymentMethod).toBe(EPaymentMethod.PIX)

      expect(updatedAppointment.paymentFee).toBe(0)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service3.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product2.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(foundAppointment.paymentMethod).toBe(EPaymentMethod.PIX)

      expect(foundAppointment.paymentFee).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment payment method to PIX", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        paymentMethod: EPaymentMethod.CASH
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service3.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product2.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(updatedAppointment.paymentMethod).toBe(EPaymentMethod.CASH)

      expect(updatedAppointment.paymentFee).toBe(0)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service3.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product2.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(foundAppointment.paymentMethod).toBe(EPaymentMethod.CASH)

      expect(foundAppointment.paymentFee).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment payment method to TRANSFER", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        paymentMethod: EPaymentMethod.TRANSFER
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service3.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product2.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(updatedAppointment.paymentMethod).toBe(EPaymentMethod.TRANSFER)

      expect(updatedAppointment.paymentFee).toBe(0)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service3.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product2.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(foundAppointment.paymentMethod).toBe(EPaymentMethod.TRANSFER)

      expect(foundAppointment.paymentFee).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment payment method to credit card and calculate fee tax", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        paymentMethod: EPaymentMethod.CREDIT_CARD
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service3.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product2.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(updatedAppointment.paymentMethod).toBe(EPaymentMethod.CREDIT_CARD)

      expect(updatedAppointment.paymentFee).toBe(((service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)) * CREDIT_CARD_FEE)

      const foundAppointment = await appointmentsService.findOne(appointment.id)

      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service3.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product2.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(foundAppointment.paymentMethod).toBe(EPaymentMethod.CREDIT_CARD)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment payment method to debit card and calculate fee tax", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        paymentMethod: EPaymentMethod.DEBIT_CARD
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.customer.id).toBe(customer.id)
      expect(updatedAppointment.customer.name).toBe(customer.name)
      expect(updatedAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(updatedAppointment.attendant?.id).toBe(attendant.id)
      expect(updatedAppointment.attendant?.name).toBe(attendant.name)
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.services[0].id).toBe(service1.id)
      expect(updatedAppointment.services[1].id).toBe(service2.id)
      expect(updatedAppointment.services[2].id).toBe(service3.id)
      expect(updatedAppointment.products[0].id).toBe(product1.id)
      expect(updatedAppointment.products[1].id).toBe(product2.id)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(updatedAppointment.paymentMethod).toBe(EPaymentMethod.DEBIT_CARD)

      expect(updatedAppointment.paymentFee).toBe(((service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)) * DEBIT_CARD_FEE)

      const foundAppointment = await appointmentsService.findOne(appointment.id)

      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.services[0].id).toBe(service1.id)
      expect(foundAppointment.services[1].id).toBe(service2.id)
      expect(foundAppointment.services[2].id).toBe(service3.id)
      expect(foundAppointment.products[0].id).toBe(product1.id)
      expect(foundAppointment.products[1].id).toBe(product2.id)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.value + service2.value + service3.value
      )
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(
        product1.value + product2.value
      )
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.finalPrice).toBeCloseTo(
        service1.value + service2.value + service3.value +
        product1.value + product2.value
      )
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(foundAppointment.paymentMethod).toBe(EPaymentMethod.DEBIT_CARD)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment status to ON_SERVICE and set onServiceAt date", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const foundAppointment = await appointmentsService.findOne(appointment.id)

      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(foundAppointment.onServiceAt).toBeUndefined()

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.ON_SERVICE
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.ON_SERVICE)
      expect(updatedAppointment.onServiceAt).toBeDefined()

      const foundAppointment2 = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment2).toBeDefined()
      expect(foundAppointment2.status).toBe(EAppointmentStatuses.ON_SERVICE)
      expect(foundAppointment2.onServiceAt).toBeDefined()

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment status to FINISHED and set finishedAt date", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const foundAppointment = await appointmentsService.findOne(appointment.id)

      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(foundAppointment.onServiceAt).toBeUndefined()
      expect(foundAppointment.finishedAt).toBeUndefined()

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.ON_SERVICE
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.ON_SERVICE)
      expect(updatedAppointment.onServiceAt).toBeDefined()
      expect(updatedAppointment.finishedAt).toBeUndefined()

      const updatedAppointment2 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.FINISHED
      })
      expect(updatedAppointment2).toBeDefined()
      expect(updatedAppointment2.status).toBe(EAppointmentStatuses.FINISHED)
      expect(updatedAppointment2.onServiceAt).toBeDefined()
      expect(updatedAppointment2.finishedAt).toBeDefined()

      const foundAppointment2 = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment2).toBeDefined()
      expect(foundAppointment2.status).toBe(EAppointmentStatuses.FINISHED)
      expect(foundAppointment2.onServiceAt).toBeDefined()
      expect(foundAppointment2.finishedAt).toBeDefined()

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not update an appointment with a invalid id", async () => {
      try {
        await appointmentsService.update("invalid-appointment-id", {
          status: EAppointmentStatuses.ON_SERVICE
        })
        fail("Expected AppointmentNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(AppointmentNotFoundException)
      }
    })

    it("should remove an appointment", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const foundAppointment = await appointmentsService.findOne(appointment.id)

      expect(foundAppointment).toBeDefined()

      await appointmentsService.remove(appointment.id)

      try {
        await appointmentsService.findOne(appointment.id)
        fail("Expected AppointmentNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(AppointmentNotFoundException)
      }

      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not remove an appointment with a invalid id", async () => {
      try {
        await appointmentsService.remove("invalid-appointment-id")
        fail("Expected AppointmentNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(AppointmentNotFoundException)
      }
    })

    it("should calculate service discount by promo value when enabled (create)", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({
        value: 20,
        promoValue: 10,
        promoEnabled: true
      }))
      const service2 = await servicesService.create(getRandomServiceCreateInputData({
        value: 50,
        promoValue: 20,
        promoEnabled: false
      }))
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 30,
        promoValue: 5,
        promoEnabled: true
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      expect(appointment).toBeDefined()
      expect(appointment.customer.id).toBe(customer.id)
      expect(appointment.customer.name).toBe(customer.name)
      expect(appointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(appointment.attendant?.id).toBe(attendant.id)
      expect(appointment.attendant?.name).toBe(attendant.name)
      expect(appointment.services).toHaveLength(3)
      expect(appointment.products).toHaveLength(0)
      expect(appointment.services[0].id).toBe(service1.id)
      expect(appointment.services[1].id).toBe(service2.id)
      expect(appointment.services[2].id).toBe(service3.id)
      expect(appointment.finalServicesPrice).toBeCloseTo(
        service1.promoValue! + service2.value + service3.promoValue!
      )
      expect(appointment.finalProductsPrice).toBe(0)
      expect(appointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(appointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(appointment.discount).toBe(service1.value - service1.promoValue! + service3.value - service3.promoValue!)
      expect(appointment.finalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)
      expect(appointment.status).toBe(EAppointmentStatuses.WAITING)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(
        service1.promoValue! + service2.value + service3.promoValue!
      )
      expect(foundAppointment.finalProductsPrice).toBe(0)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment.discount).toBe(service1.value - service1.promoValue! + service3.value - service3.promoValue!)
      expect(foundAppointment.finalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should calculate product discount by promo value when enabled (create)", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({
        value: 77
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData({
        value: 19,
        promoValue: 5,
        promoEnabled: true
      }))

      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 25,
        promoValue: 10,
        promoEnabled: false
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id],
        productIds: [product1.id, product2.id]
      })

      expect(appointment).toBeDefined()
      expect(appointment.customer.id).toBe(customer.id)
      expect(appointment.customer.name).toBe(customer.name)
      expect(appointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(appointment.attendant?.id).toBe(attendant.id)
      expect(appointment.attendant?.name).toBe(attendant.name)
      expect(appointment.services).toHaveLength(1)
      expect(appointment.products).toHaveLength(2)
      expect(appointment.services[0].id).toBe(service1.id)
      expect(appointment.products[0].id).toBe(product1.id)
      expect(appointment.products[1].id).toBe(product2.id)
      expect(appointment.finalServicesPrice).toBeCloseTo(service1.value)
      expect(appointment.finalProductsPrice).toBeCloseTo(product1.promoValue! + product2.value)
      expect(appointment.totalServiceWeight).toBeCloseTo(service1.weight || 0)
      expect(appointment.totalPrice).toBeCloseTo(service1.value + product1.value + product2.value)
      expect(appointment.discount).toBeCloseTo(product1.value - product1.promoValue!)
      expect(appointment.finalPrice).toBeCloseTo(service1.value + product1.promoValue! + product2.value)
      expect(appointment.status).toBe(EAppointmentStatuses.WAITING)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(service1.value)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(product1.promoValue! + product2.value)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(service1.weight || 0)
      expect(foundAppointment.totalPrice).toBeCloseTo(service1.value + product1.value + product2.value)
      expect(foundAppointment.discount).toBeCloseTo(product1.value - product1.promoValue!)
      expect(foundAppointment.finalPrice).toBeCloseTo(service1.value + product1.promoValue! + product2.value)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not recalculate discount by promo value when original service price update", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({
        value: 20
      }))
      const service2 = await servicesService.create(getRandomServiceCreateInputData({
        value: 50,
        promoValue: 20,
        promoEnabled: false
      }))
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 30,
        promoValue: 5,
        promoEnabled: false
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const updateService1Data: UpdateServiceInput = {
        value: 100,
        promoValue: 86,
        promoEnabled: true
      }
      const updateService3Data: UpdateServiceInput = {
        promoValue: 25,
        promoEnabled: true
      }

      await servicesService.update(service1.id, updateService1Data)
      await servicesService.update(service3.id, updateService3Data)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment.finalProductsPrice).toBe(0)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.finalPrice).toBeCloseTo(service1.value + service2.value + service3.value)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not recalculate discount by promo value when original product price update", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({
        value: 77
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData({
        value: 19,
        promoValue: 5,
        promoEnabled: true
      }))

      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 25,
        promoValue: 10,
        promoEnabled: false
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id],
        productIds: [product1.id, product2.id]
      })

      const updateProduct1Data: UpdateServiceInput = {
        value: 100,
        promoValue: 60,
        promoEnabled: true
      }
      const updateProduct2Data: UpdateServiceInput = {
        value: 267,
        promoValue: 200,
        promoEnabled: true
      }

      await productsService.update(product1.id, updateProduct1Data)
      await productsService.update(product2.id, updateProduct2Data)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(service1.value)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(product1.promoValue! + product2.value)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(service1.weight || 0)
      expect(foundAppointment.totalPrice).toBeCloseTo(service1.value + product1.value + product2.value)
      expect(foundAppointment.discount).toBe(product1.value - product1.promoValue!)
      expect(foundAppointment.finalPrice).toBeCloseTo(service1.value + product1.promoValue! + product2.value)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should recalculate discount by promo value when service list is updated", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({
        value: 20,
        promoValue: 10,
        promoEnabled: true
      }))
      const service2 = await servicesService.create(getRandomServiceCreateInputData({
        value: 50,
        promoValue: 20,
        promoEnabled: false
      }))
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 30,
        promoValue: 5,
        promoEnabled: true
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        serviceIds: [service1.id, service2.id, service3.id]
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)
      expect(updatedAppointment.finalProductsPrice).toBe(0)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.finalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)

      const foundAppointment = await appointmentsService.findOne(appointment.id)

      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)
      expect(foundAppointment.finalProductsPrice).toBe(0)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.finalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should recalculate discount by promo value when product list is updated", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({
        value: 20,
        promoValue: 10,
        promoEnabled: true
      }))
      const service2 = await servicesService.create(getRandomServiceCreateInputData({
        value: 50,
        promoValue: 20,
        promoEnabled: false
      }))
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 30,
        promoValue: 5,
        promoEnabled: true
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData({
        value: 19,
        promoValue: 5,
        promoEnabled: true
      }))

      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 25,
        promoValue: 10,
        promoEnabled: false
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id],
        productIds: [product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(product1.promoValue! + product2.value)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(updatedAppointment.totalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue! + product1.promoValue! + product2.value)
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.finalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue! + product1.promoValue! + product2.value)

      const foundAppointment = await appointmentsService.findOne(appointment.id)

      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(product1.promoValue! + product2.value)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(
        (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      )
      expect(foundAppointment.totalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue! + product1.promoValue! + product2.value)
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.finalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue! + product1.promoValue! + product2.value)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should increment a customer (indicated) and customer (indicator) referralCodeCount when its code is used only when a service is concluded", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer1 = await customersService.create(getRandomCustomerCreateInputData())
      const customer2 = await customersService.create(getRandomCustomerCreateInputData({
        referralCodeUsed: customer1.referralCode
      }))
      const service1 = await servicesService.create(getRandomServiceCreateInputData())

      // Check if the referralCodeCount is 0 before creating the appointment
      const foundCustomer1 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1).toBeDefined()
      expect(foundCustomer2).toBeDefined()
      expect(foundCustomer1.referralCodeCount).toBe(0)
      expect(foundCustomer2.referralCodeCount).toBe(0)

      const appointment = await appointmentsService.create({
        customerId: customer2.id,
        attendantId: attendant.id,
        serviceIds: [service1.id]
      })

      // Change status to ON_SERVICE and check if the referralCodeCount is still 0
      const updatedAppointment = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.ON_SERVICE
      })
      expect(updatedAppointment.customer.referralCodeCount).toBe(0)
      const foundCustomer1_2 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_2 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_2.referralCodeCount).toBe(0)
      expect(foundCustomer2_2.referralCodeCount).toBe(0)

      // Change status to CANCELLED and check if the referralCodeCount is still 0
      const updatedAppointment2 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.CANCELLED
      })
      expect(updatedAppointment2.customer.referralCodeCount).toBe(0)
      const foundCustomer1_3 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_3 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_3.referralCodeCount).toBe(0)
      expect(foundCustomer2_3.referralCodeCount).toBe(0)

      // Change status to NO_SHOW and check if the referralCodeCount is 0
      const updatedAppointment3 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.NO_SHOW
      })
      expect(updatedAppointment3.customer.referralCodeCount).toBe(0)
      const foundCustomer1_4 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_4 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_4.referralCodeCount).toBe(0)
      expect(foundCustomer2_4.referralCodeCount).toBe(0)

      // Change status to FINISHED and check if the referralCodeCount is 1
      const updatedAppointment4 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.FINISHED
      })
      expect(updatedAppointment4.customer.referralCodeCount).toBe(1)
      const foundCustomer1_5 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_5 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_5.referralCodeCount).toBe(1)
      expect(foundCustomer2_5.referralCodeCount).toBe(1)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer1.id)
      await customersService.remove(customer2.id)
      await servicesService.remove(service1.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not increment a customer (indicator) referralCodeCount if the code used is invalid", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData({
        referralCodeUsed: "invalid-referral-code"
      }))
      const service1 = await servicesService.create(getRandomServiceCreateInputData())

      // Check if the referralCodeCount is 0 before creating the appointment
      const foundCustomer2 = await customersService.findOne({ id: customer.id })
      expect(foundCustomer2).toBeDefined()
      expect(foundCustomer2.referralCodeCount).toBe(0)

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id]
      })

      // Change status to ON_SERVICE and check if the referralCodeCount is still 0
      const updatedAppointment = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.ON_SERVICE
      })
      expect(updatedAppointment.customer.referralCodeCount).toBe(0)
      const foundCustomer2_2 = await customersService.findOne({ id: customer.id })
      expect(foundCustomer2_2.referralCodeCount).toBe(0)

      // Change status to CANCELLED and check if the referralCodeCount is still 0
      const updatedAppointment2 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.CANCELLED
      })
      expect(updatedAppointment2.customer.referralCodeCount).toBe(0)
      const foundCustomer2_3 = await customersService.findOne({ id: customer.id })
      expect(foundCustomer2_3.referralCodeCount).toBe(0)

      // Change status to NO_SHOW and check if the referralCodeCount is still 0
      const updatedAppointment3 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.NO_SHOW
      })
      expect(updatedAppointment3.customer.referralCodeCount).toBe(0)
      const foundCustomer2_4 = await customersService.findOne({ id: customer.id })
      expect(foundCustomer2_4.referralCodeCount).toBe(0)

      // Change status to FINISHED and check if the referralCodeCount is still 0
      const updatedAppointment4 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.FINISHED
      })
      expect(updatedAppointment4.customer.referralCodeCount).toBe(0)
      const foundCustomer2_5 = await customersService.findOne({ id: customer.id })
      expect(foundCustomer2_5.referralCodeCount).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not increment a customer (indicator) referralCodeCount if no code used is used", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())

      // Check if the referralCodeCount is 0 before creating the appointment
      const foundCustomer2 = await customersService.findOne({ id: customer.id })
      expect(foundCustomer2).toBeDefined()
      expect(foundCustomer2.referralCodeCount).toBe(0)

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id]
      })

      // Change status to ON_SERVICE and check if the referralCodeCount is still 0
      const updatedAppointment = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.ON_SERVICE
      })
      expect(updatedAppointment.customer.referralCodeCount).toBe(0)
      const foundCustomer2_2 = await customersService.findOne({ id: customer.id })
      expect(foundCustomer2_2.referralCodeCount).toBe(0)

      // Change status to CANCELLED and check if the referralCodeCount is still 0
      const updatedAppointment2 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.CANCELLED
      })
      expect(updatedAppointment2.customer.referralCodeCount).toBe(0)
      const foundCustomer2_3 = await customersService.findOne({ id: customer.id })
      expect(foundCustomer2_3.referralCodeCount).toBe(0)

      // Change status to NO_SHOW and check if the referralCodeCount is still 0
      const updatedAppointment3 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.NO_SHOW
      })
      expect(updatedAppointment3.customer.referralCodeCount).toBe(0)
      const foundCustomer2_4 = await customersService.findOne({ id: customer.id })
      expect(foundCustomer2_4.referralCodeCount).toBe(0)

      // Change status to FINISHED and check if the referralCodeCount is still 0
      const updatedAppointment4 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.FINISHED
      })
      expect(updatedAppointment4.customer.referralCodeCount).toBe(0)
      const foundCustomer2_5 = await customersService.findOne({ id: customer.id })
      expect(foundCustomer2_5.referralCodeCount).toBe(0)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await usersService.remove({ id: attendant.id })
    })


    it("should not increment a customer (indicated) and customer (indicator) referralCodeCount when its not first appointment", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer1 = await customersService.create(getRandomCustomerCreateInputData())
      const customer2 = await customersService.create(getRandomCustomerCreateInputData({
        referralCodeUsed: customer1.referralCode
      }))
      const service1 = await servicesService.create(getRandomServiceCreateInputData())

      // Check if the referralCodeCount is 0 before creating the appointment
      const foundCustomer1 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1).toBeDefined()
      expect(foundCustomer2).toBeDefined()
      expect(foundCustomer1.referralCodeCount).toBe(0)
      expect(foundCustomer2.referralCodeCount).toBe(0)

      const appointment = await appointmentsService.create({
        customerId: customer2.id,
        attendantId: attendant.id,
        serviceIds: [service1.id]
      })

      // Change status to ON_SERVICE and check if the referralCodeCount is still 0
      const updatedAppointment = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.ON_SERVICE
      })
      expect(updatedAppointment.customer.referralCodeCount).toBe(0)
      const foundCustomer1_2 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_2 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_2.referralCodeCount).toBe(0)
      expect(foundCustomer2_2.referralCodeCount).toBe(0)

      // Change status to CANCELLED and check if the referralCodeCount is still 0
      const updatedAppointment2 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.CANCELLED
      })
      expect(updatedAppointment2.customer.referralCodeCount).toBe(0)
      const foundCustomer1_3 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_3 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_3.referralCodeCount).toBe(0)
      expect(foundCustomer2_3.referralCodeCount).toBe(0)

      // Change status to NO_SHOW and check if the referralCodeCount is 0
      const updatedAppointment3 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.NO_SHOW
      })
      expect(updatedAppointment3.customer.referralCodeCount).toBe(0)
      const foundCustomer1_4 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_4 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_4.referralCodeCount).toBe(0)
      expect(foundCustomer2_4.referralCodeCount).toBe(0)

      // Change status to FINISHED and check if the referralCodeCount is 1
      const updatedAppointment4 = await appointmentsService.update(appointment.id, {
        status: EAppointmentStatuses.FINISHED
      })
      expect(updatedAppointment4.customer.referralCodeCount).toBe(1)
      const foundCustomer1_5 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_5 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_5.referralCodeCount).toBe(1)
      expect(foundCustomer2_5.referralCodeCount).toBe(1)

      // Second appointment for customer2
      const appointment2 = await appointmentsService.create({
        customerId: customer2.id,
        attendantId: attendant.id,
        serviceIds: [service1.id]
      })

      // Change status to ON_SERVICE and check if the referralCodeCount is still 1
      const updatedAppointment5 = await appointmentsService.update(appointment2.id, {
        status: EAppointmentStatuses.ON_SERVICE
      })
      expect(updatedAppointment5.customer.referralCodeCount).toBe(1)
      const foundCustomer1_6 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_6 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_6.referralCodeCount).toBe(1)
      expect(foundCustomer2_6.referralCodeCount).toBe(1)

      // Change status to CANCELLED and check if the referralCodeCount is still 1
      const updatedAppointment6 = await appointmentsService.update(appointment2.id, {
        status: EAppointmentStatuses.CANCELLED
      })
      expect(updatedAppointment6.customer.referralCodeCount).toBe(1)
      const foundCustomer1_7 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_7 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_7.referralCodeCount).toBe(1)
      expect(foundCustomer2_7.referralCodeCount).toBe(1)

      // Change status to NO_SHOW and check if the referralCodeCount is still 1
      const updatedAppointment7 = await appointmentsService.update(appointment2.id, {
        status: EAppointmentStatuses.NO_SHOW
      })
      expect(updatedAppointment7.customer.referralCodeCount).toBe(1)
      const foundCustomer1_8 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_8 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_8.referralCodeCount).toBe(1)
      expect(foundCustomer2_8.referralCodeCount).toBe(1)

      // Change status to FINISHED and check if the referralCodeCount is still 1
      const updatedAppointment8 = await appointmentsService.update(appointment2.id, {
        status: EAppointmentStatuses.FINISHED
      })
      expect(updatedAppointment8.customer.referralCodeCount).toBe(1)
      const foundCustomer1_9 = await customersService.findOne({ id: customer1.id })
      const foundCustomer2_9 = await customersService.findOne({ id: customer2.id })
      expect(foundCustomer1_9.referralCodeCount).toBe(1)
      expect(foundCustomer2_9.referralCodeCount).toBe(1)

      await appointmentsService.remove(appointment.id)
      await appointmentsService.remove(appointment2.id)
      await customersService.remove(customer1.id)
      await customersService.remove(customer2.id)
      await servicesService.remove(service1.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update and recalculate appointment prices when added a parking partnership 1", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 15.12,
        promoValue: 5.23,
        promoEnabled: true
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData({
        value: 20
      }))
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 13,
        promoValue: 11,
        promoEnabled: true
      }))

      const partnership = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.FIXED,
        discountValue: 8.08,
        type: EPartnershipType.PARKING
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        partnershipIds: [partnership.id]
      })

      const finalServicesPrice = service1.value + service2.value + service3.promoValue!
      const finalProductsPrice = product1.value + product2.promoValue!
      const servicesWeight = (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      const totalPrice = service1.value + service2.value + service3.promoValue! +
        product1.value + product2.promoValue!
      const discount = partnership.discountValue
      const finalPrice = totalPrice - discount

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.partnerships).toHaveLength(1)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(updatedAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(updatedAppointment.discount).toBeCloseTo(discount)
      expect(updatedAppointment.finalPrice).toBeCloseTo(finalPrice)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.partnerships).toHaveLength(1)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(foundAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(foundAppointment.discount).toBeCloseTo(discount)
      expect(foundAppointment.finalPrice).toBeCloseTo(finalPrice)

      await appointmentsService.remove(appointment.id)
      await partnershipsService.remove(partnership.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should update and recalculate appointment prices when added a parking partnership 2", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 15.12,
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 12.74,
      }))

      const partnership = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.FIXED,
        discountValue: 8.08,
        type: EPartnershipType.PARKING
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        partnershipIds: [partnership.id]
      })

      const finalServicesPrice = service1.value + service2.value + service3.value
      const finalProductsPrice = product1.value + product2.value
      const servicesWeight = (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      const totalPrice = service1.value + service2.value + service3.value +
        product1.value + product2.value
      const discount = partnership.discountValue
      const finalPrice = totalPrice - discount

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.partnerships).toHaveLength(1)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(updatedAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(updatedAppointment.discount).toBeCloseTo(discount)
      expect(updatedAppointment.finalPrice).toBeCloseTo(finalPrice)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.partnerships).toHaveLength(1)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(foundAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(foundAppointment.discount).toBeCloseTo(discount)
      expect(foundAppointment.finalPrice).toBeCloseTo(finalPrice)

      await appointmentsService.remove(appointment.id)
      await partnershipsService.remove(partnership.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should update and recalculate appointment prices when added a fixed price partnership 1", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 15.12,
        promoValue: 5.23,
        promoEnabled: true
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 12.74,
        promoValue: 2.71,
        promoEnabled: true
      }))

      const partnership = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.FIXED,
        discountValue: 8.08,
        type: EPartnershipType.COMMON
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        partnershipIds: [partnership.id]
      })

      const finalServicesPrice = service1.value + service2.value + service3.promoValue!
      const finalProductsPrice = product1.value + product2.promoValue!
      const servicesWeight = (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      const totalPrice = finalServicesPrice + finalProductsPrice
      const discount = partnership.discountValue
      const finalPrice = totalPrice - discount

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.partnerships).toHaveLength(1)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(updatedAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(updatedAppointment.discount).toBeCloseTo(discount)
      expect(updatedAppointment.finalPrice).toBeCloseTo(finalPrice)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.partnerships).toHaveLength(1)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(foundAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(foundAppointment.discount).toBeCloseTo(discount)
      expect(foundAppointment.finalPrice).toBeCloseTo(finalPrice)

      await appointmentsService.remove(appointment.id)
      await partnershipsService.remove(partnership.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should update and recalculate appointment prices when added a fixed price partnership 2", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 15.12
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 12.74
      }))

      const partnership = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.FIXED,
        discountValue: 8.08,
        type: EPartnershipType.COMMON
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        partnershipIds: [partnership.id]
      })

      const finalServicesPrice = service1.value + service2.value + service3.value
      const finalProductsPrice = product1.value + product2.value
      const servicesWeight = (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      const totalPrice = service1.value + service2.value + service3.value +
        product1.value + product2.value
      const discount = partnership.discountValue
      const finalPrice = totalPrice - discount

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.partnerships).toHaveLength(1)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(updatedAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(updatedAppointment.discount).toBeCloseTo(discount)
      expect(updatedAppointment.finalPrice).toBeCloseTo(finalPrice)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.partnerships).toHaveLength(1)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(foundAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(foundAppointment.discount).toBeCloseTo(discount)
      expect(foundAppointment.finalPrice).toBeCloseTo(finalPrice)

      await appointmentsService.remove(appointment.id)
      await partnershipsService.remove(partnership.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should update and recalculate appointment prices when added a percentage partnership 1", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({ value: 20 }))
      const service2 = await servicesService.create(getRandomServiceCreateInputData({ value: 50 }))
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 70,
        promoValue: 60,
        promoEnabled: true
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData({ value: 8 }))
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 12.74,
        promoValue: 4,
        promoEnabled: true
      }))

      const partnership = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.PERCENTAGE,
        discountValue: 10,
        type: EPartnershipType.COMMON
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        partnershipIds: [partnership.id]
      })

      const finalServicesPrice = service1.value + service2.value + service3.promoValue!
      const finalProductsPrice = product1.value + product2.promoValue!
      const servicesWeight = (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      const totalPrice = finalServicesPrice + finalProductsPrice
      const discount = totalPrice * (partnership.discountValue / 100)
      const finalPrice = totalPrice - discount

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.partnerships).toHaveLength(1)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(updatedAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(updatedAppointment.discount).toBeCloseTo(discount)
      expect(updatedAppointment.finalPrice).toBeCloseTo(finalPrice)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.partnerships).toHaveLength(1)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(foundAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(foundAppointment.discount).toBeCloseTo(discount)
      expect(foundAppointment.finalPrice).toBeCloseTo(finalPrice)

      await appointmentsService.remove(appointment.id)
      await partnershipsService.remove(partnership.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should update and recalculate appointment prices when added a percentage partnership 2", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({ value: 20 }))
      const service2 = await servicesService.create(getRandomServiceCreateInputData({ value: 50 }))
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 70
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData({ value: 8 }))
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 12.74
      }))

      const partnership = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.PERCENTAGE,
        discountValue: 10,
        type: EPartnershipType.COMMON
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        partnershipIds: [partnership.id]
      })

      const finalServicesPrice = service1.value + service2.value + service3.value
      const finalProductsPrice = product1.value + product2.value
      const servicesWeight = (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      const totalPrice = service1.value + service2.value + service3.value +
        product1.value + product2.value
      const discount = totalPrice * (partnership.discountValue / 100)
      const finalPrice = totalPrice - discount

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.partnerships).toHaveLength(1)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(updatedAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(updatedAppointment.discount).toBeCloseTo(discount)
      expect(updatedAppointment.finalPrice).toBeCloseTo(finalPrice)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.partnerships).toHaveLength(1)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(foundAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(foundAppointment.discount).toBeCloseTo(discount)
      expect(foundAppointment.finalPrice).toBeCloseTo(finalPrice)

      await appointmentsService.remove(appointment.id)
      await partnershipsService.remove(partnership.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should update and recalculate appointment prices when added a percentage and fixed price partnership 1", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({ value: 20 }))
      const service2 = await servicesService.create(getRandomServiceCreateInputData({ value: 50 }))
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 70,
        promoValue: 60,
        promoEnabled: true
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData({ value: 8 }))
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 12.74,
        promoValue: 4,
        promoEnabled: true
      }))

      const partnership1 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.PERCENTAGE,
        discountValue: 10,
        type: EPartnershipType.COMMON
      }))

      const partnership2 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.FIXED,
        discountValue: 8.08,
        type: EPartnershipType.PARKING
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        partnershipIds: [partnership1.id, partnership2.id]
      })

      const finalServicesPrice = service1.value + service2.value + service3.promoValue!
      const finalProductsPrice = product1.value + product2.promoValue!
      const servicesWeight = (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      const totalPrice = finalServicesPrice + finalProductsPrice
      const discount = partnership2.discountValue + totalPrice * (partnership1.discountValue / 100)
      const finalPrice = totalPrice - discount

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.partnerships).toHaveLength(2)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(updatedAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(updatedAppointment.discount).toBeCloseTo(discount)
      expect(updatedAppointment.finalPrice).toBeCloseTo(finalPrice)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.partnerships).toHaveLength(2)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(foundAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(foundAppointment.discount).toBeCloseTo(discount)
      expect(foundAppointment.finalPrice).toBeCloseTo(finalPrice)

      await appointmentsService.remove(appointment.id)
      await partnershipsService.remove(partnership1.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should update and recalculate appointment prices when added a percentage and fixed price partnership 2", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({ value: 20 }))
      const service2 = await servicesService.create(getRandomServiceCreateInputData({ value: 50 }))
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 70,
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData({ value: 8 }))
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 12.74,
      }))

      const partnership1 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.PERCENTAGE,
        discountValue: 10,
        type: EPartnershipType.COMMON
      }))

      const partnership2 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.FIXED,
        discountValue: 8.08,
        type: EPartnershipType.PARKING
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        partnershipIds: [partnership1.id, partnership2.id]
      })

      const finalServicesPrice = service1.value + service2.value + service3.value
      const finalProductsPrice = product1.value + product2.value
      const servicesWeight = (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      const totalPrice = finalServicesPrice + finalProductsPrice
      const discount = partnership2.discountValue + totalPrice * (partnership1.discountValue / 100)
      const finalPrice = totalPrice - discount

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.partnerships).toHaveLength(2)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(updatedAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(updatedAppointment.discount).toBeCloseTo(discount)
      expect(updatedAppointment.finalPrice).toBeCloseTo(finalPrice)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.partnerships).toHaveLength(2)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(foundAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(foundAppointment.discount).toBeCloseTo(discount)
      expect(foundAppointment.finalPrice).toBeCloseTo(finalPrice)

      await appointmentsService.remove(appointment.id)
      await partnershipsService.remove(partnership1.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should simulate checkout 1", async () => {
      // Add services, products, and partnerships to an appointment and check the final prices

      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({ value: 20 }))
      const service2 = await servicesService.create(getRandomServiceCreateInputData({ value: 50 }))
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 70,
        promoValue: 60,
        promoEnabled: true
      }))

      const product1 = await productsService.create(getRandomProductCreateInputData({ value: 8 }))
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 12.74,
        promoValue: 4,
        promoEnabled: true
      }))

      const partnership1 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.PERCENTAGE,
        discountValue: 10,
        type: EPartnershipType.COMMON
      }))

      const partnership2 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.FIXED,
        discountValue: 8.08,
        type: EPartnershipType.PARKING
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        serviceIds: [service1.id, service2.id, service3.id],
        productIds: [product1.id, product2.id],
        partnershipIds: [partnership1.id, partnership2.id]
      })

      const finalServicesPrice = service1.value + service2.value + service3.promoValue!
      const finalProductsPrice = product1.value + product2.promoValue!
      const servicesWeight = (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      const totalPrice = finalServicesPrice + finalProductsPrice
      const discount = partnership2.discountValue + totalPrice * (partnership1.discountValue / 100)
      const finalPrice = totalPrice - discount

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(2)
      expect(updatedAppointment.partnerships).toHaveLength(2)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(updatedAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(updatedAppointment.discount).toBeCloseTo(discount)
      expect(updatedAppointment.finalPrice).toBeCloseTo(finalPrice)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(2)
      expect(foundAppointment.partnerships).toHaveLength(2)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(foundAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(foundAppointment.discount).toBeCloseTo(discount)
      expect(foundAppointment.finalPrice).toBeCloseTo(finalPrice)

      await appointmentsService.remove(appointment.id)
      await partnershipsService.remove(partnership1.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should simulate checkout 2", async () => {
      // Add services and add partnerships to an appointment and check the final prices

      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData({ value: 20 }))
      const service2 = await servicesService.create(getRandomServiceCreateInputData({ value: 50 }))
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 70,
        promoValue: 60,
        promoEnabled: true
      }))

      const partnership1 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.PERCENTAGE,
        discountValue: 10,
        type: EPartnershipType.COMMON
      }))

      const partnership2 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.FIXED,
        discountValue: 8.08,
        type: EPartnershipType.PARKING
      }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id]
      })

      const updatedAppointment = await appointmentsService.update(appointment.id, {
        serviceIds: [service1.id, service2.id, service3.id],
        partnershipIds: [partnership1.id, partnership2.id]
      })

      const finalServicesPrice = service1.value + service2.value + service3.promoValue!
      const finalProductsPrice = 0
      const servicesWeight = (service1.weight || 0) + (service2.weight || 0) + (service3.weight || 0)
      const totalPrice = finalServicesPrice + finalProductsPrice
      const discount = partnership2.discountValue + totalPrice * (partnership1.discountValue / 100)
      const finalPrice = totalPrice - discount

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.services).toHaveLength(3)
      expect(updatedAppointment.products).toHaveLength(0)
      expect(updatedAppointment.partnerships).toHaveLength(2)
      expect(updatedAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(updatedAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(updatedAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(updatedAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(updatedAppointment.discount).toBeCloseTo(discount)
      expect(updatedAppointment.finalPrice).toBeCloseTo(finalPrice)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.products).toHaveLength(0)
      expect(foundAppointment.partnerships).toHaveLength(2)
      expect(foundAppointment.finalServicesPrice).toBeCloseTo(finalServicesPrice)
      expect(foundAppointment.finalProductsPrice).toBeCloseTo(finalProductsPrice)
      expect(foundAppointment.totalServiceWeight).toBeCloseTo(servicesWeight)
      expect(foundAppointment.totalPrice).toBeCloseTo(totalPrice)
      expect(foundAppointment.discount).toBeCloseTo(discount)
      expect(foundAppointment.finalPrice).toBeCloseTo(finalPrice)

      await appointmentsService.remove(appointment.id)
      await partnershipsService.remove(partnership1.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should simulate attendant day summary", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 70,
        promoValue: 60,
        promoEnabled: true
      }))
      const service4 = await servicesService.create(getRandomServiceCreateInputData())
      const service5 = await servicesService.create(getRandomServiceCreateInputData())
      const service6 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 12.74,
        promoValue: 4,
        promoEnabled: true
      }))
      const product3 = await productsService.create(getRandomProductCreateInputData())
      const product4 = await productsService.create(getRandomProductCreateInputData())
      const product5 = await productsService.create(getRandomProductCreateInputData())

      const partnership1 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.PERCENTAGE,
        discountValue: 10,
        type: EPartnershipType.COMMON
      }))

      const partnership2 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.FIXED,
        discountValue: 8.08,
        type: EPartnershipType.PARKING
      }))

      const appointments: Appointment[] = []

      for (let i = 0; i < 15; i++) {
        const appointment = await appointmentsService.create({
          customerId: customer.id,
          attendantId: attendant1.id,
          serviceIds: faker.helpers.arrayElements([service1.id, service2.id, service3.id, service4.id, service5.id, service6.id], { min: 1, max: 1 }),
        })
        appointments.push(appointment)
      }

      // Start Attendance
      for (const appointment of appointments) {
        await appointmentsService.update(appointment.id, {
          status: EAppointmentStatuses.ON_SERVICE
        })
      }

      // Finish Attendance
      const updatedAppointments: Appointment[] = []

      for (let i = 0; i < 15; i++) {
        const appointment = appointments[i]
        const updatedAppointment = await appointmentsService.update(appointment.id, {
          serviceIds: faker.helpers.arrayElements([service1.id, service2.id, service3.id, service4.id, service5.id, service6.id], { min: 1, max: 2 }),
          productIds: faker.helpers.arrayElements([product1.id, product2.id, product3.id, product4.id, product5.id], { min: 0, max: 2 }),
          partnershipIds: faker.helpers.arrayElements([partnership1.id, partnership2.id], { min: 0, max: 2 }),
          status: EAppointmentStatuses.FINISHED
        })
        updatedAppointments.push(updatedAppointment)
      }

      const { results, total } = await appointmentsService.findAll({
        onlyToday: true,
        attendantId: attendant1.id,
        limit: 1000,
        status: EAppointmentStatuses.FINISHED,
        sortBy: 'createdAt',
        order: 'asc',
      })

      const summaryView = new AppointmentSummaryView(results)

      const finalServicesPrice = updatedAppointments.reduce((total, appointment) => {
        return total + appointment.finalServicesPrice
      }, 0)
      const finalProductsPrice = updatedAppointments.reduce((total, appointment) => {
        return total + appointment.finalProductsPrice
      }, 0)
      const servicesWeight = updatedAppointments.reduce((total, appointment) => {
        return total + appointment.totalServiceWeight
      }, 0)
      const totalPrice = finalServicesPrice + finalProductsPrice
      const discount = updatedAppointments.reduce((total, appointment) => {
        return total + (appointment.discount || 0)
      }, 0)
      const finalPrice = totalPrice - discount

      expect(summaryView).toBeDefined()
      expect(summaryView.attendantId).toBe(attendant1.id)
      expect(summaryView.attendantName).toBe(attendant1.name)
      expect(summaryView.finalProductsPrice).toBe(finalProductsPrice)
      expect(summaryView.finalServicesPrice).toBe(finalServicesPrice)
      expect(summaryView.totalAppointments).toBe(15)
      expect(summaryView.totalDiscount).toBe(discount)
      expect(summaryView.totalFinalPrice).toBe(finalPrice)
      expect(summaryView.totalPrice).toBe(totalPrice)
      expect(summaryView.totalServiceWeight).toBe(servicesWeight)

      // Delete appointments and clean up
      for (const appointment of updatedAppointments) {
        await appointmentsService.remove(appointment.id)
      }

      await partnershipsService.remove(partnership1.id)
      await partnershipsService.remove(partnership2.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await servicesService.remove(service4.id)
      await servicesService.remove(service5.id)
      await servicesService.remove(service6.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await productsService.remove(product3.id)
      await productsService.remove(product4.id)
      await productsService.remove(product5.id)
      await usersService.remove({ id: attendant1.id })
    })

    it("should get attendant day summary from a specific date", async () => {
      const attendant1 = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({
        value: 70,
        promoValue: 60,
        promoEnabled: true
      }))
      const service4 = await servicesService.create(getRandomServiceCreateInputData())
      const service5 = await servicesService.create(getRandomServiceCreateInputData())
      const service6 = await servicesService.create(getRandomServiceCreateInputData())

      const product1 = await productsService.create(getRandomProductCreateInputData())
      const product2 = await productsService.create(getRandomProductCreateInputData({
        value: 12.74,
        promoValue: 4,
        promoEnabled: true
      }))
      const product3 = await productsService.create(getRandomProductCreateInputData())
      const product4 = await productsService.create(getRandomProductCreateInputData())
      const product5 = await productsService.create(getRandomProductCreateInputData())

      const partnership1 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.PERCENTAGE,
        discountValue: 10,
        type: EPartnershipType.COMMON
      }))

      const partnership2 = await partnershipsService.create(getRandomPartnershipCreateInputData({
        discountType: EPartnershipDiscountType.FIXED,
        discountValue: 8.08,
        type: EPartnershipType.PARKING
      }))

      const todayAppointments: Appointment[] = []

      for (let i = 0; i < 10; i++) {
        const appointment = await appointmentsService.create({
          customerId: customer.id,
          attendantId: attendant1.id,
          serviceIds: faker.helpers.arrayElements([service1.id, service2.id, service3.id, service4.id, service5.id, service6.id], { min: 1, max: 1 }),
        })
        todayAppointments.push(appointment)
      }

      const pastAppointments: Appointment[] = []
      const pastDate = subDays(new Date(), 4)

      for (let i = 0; i < 10; i++) {
        const appointment = await appointmentsService.create({
          customerId: customer.id,
          attendantId: attendant1.id,
          serviceIds: faker.helpers.arrayElements([service1.id, service2.id, service3.id, service4.id, service5.id, service6.id], { min: 1, max: 1 }),
          createdAt: pastDate
        })
        pastAppointments.push(appointment)
      }

      // Start Attendance
      for (const appointment of todayAppointments) {
        await appointmentsService.update(appointment.id, {
          status: EAppointmentStatuses.ON_SERVICE
        })
      }

      // Start Attendance for past appointments
      for (const appointment of pastAppointments) {
        await appointmentsService.update(appointment.id, {
          status: EAppointmentStatuses.ON_SERVICE
        })
      }

      // Finish Attendance
      const updatedTodayAppointments: Appointment[] = []

      for (let i = 0; i < 10; i++) {
        const appointment = todayAppointments[i]
        const updatedAppointment = await appointmentsService.update(appointment.id, {
          serviceIds: faker.helpers.arrayElements([service1.id, service2.id, service3.id, service4.id, service5.id, service6.id], { min: 1, max: 2 }),
          productIds: faker.helpers.arrayElements([product1.id, product2.id, product3.id, product4.id, product5.id], { min: 0, max: 2 }),
          partnershipIds: faker.helpers.arrayElements([partnership1.id, partnership2.id], { min: 0, max: 2 }),
          status: EAppointmentStatuses.FINISHED
        })
        updatedTodayAppointments.push(updatedAppointment)
      }

      const updatedPastAppointments: Appointment[] = []

      for (let i = 0; i < 10; i++) {
        const appointment = pastAppointments[i]
        const updatedAppointment = await appointmentsService.update(appointment.id, {
          serviceIds: faker.helpers.arrayElements([service1.id, service2.id, service3.id, service4.id, service5.id, service6.id], { min: 1, max: 2 }),
          productIds: faker.helpers.arrayElements([product1.id, product2.id, product3.id, product4.id, product5.id], { min: 0, max: 2 }),
          partnershipIds: faker.helpers.arrayElements([partnership1.id, partnership2.id], { min: 0, max: 2 }),
          status: EAppointmentStatuses.FINISHED
        })
        updatedPastAppointments.push(updatedAppointment)
      }

      const { results: today } = await appointmentsService.findAll({
        onlyToday: true,
        attendantId: attendant1.id,
        limit: 1000,
        status: EAppointmentStatuses.FINISHED,
        sortBy: 'createdAt',
        order: 'asc',
      })

      const todaySummaryView = new AppointmentSummaryView(today)

      const todayFinalServicesPrice = updatedTodayAppointments.reduce((total, appointment) => {
        return total + appointment.finalServicesPrice
      }, 0)
      const todayFinalProductsPrice = updatedTodayAppointments.reduce((total, appointment) => {
        return total + appointment.finalProductsPrice
      }, 0)
      const todayServicesWeight = updatedTodayAppointments.reduce((total, appointment) => {
        return total + appointment.totalServiceWeight
      }, 0)
      const todayTotalPrice = todayFinalServicesPrice + todayFinalProductsPrice
      const todayDiscount = updatedTodayAppointments.reduce((total, appointment) => {
        return total + (appointment.discount || 0)
      }, 0)
      const todayFinalPrice = todayTotalPrice - todayDiscount

      expect(todaySummaryView).toBeDefined()
      expect(todaySummaryView.attendantId).toBe(attendant1.id)
      expect(todaySummaryView.attendantName).toBe(attendant1.name)
      expect(todaySummaryView.finalProductsPrice).toBe(todayFinalProductsPrice)
      expect(todaySummaryView.finalServicesPrice).toBe(todayFinalServicesPrice)
      expect(todaySummaryView.totalAppointments).toBe(10)
      expect(todaySummaryView.totalDiscount).toBe(todayDiscount)
      expect(todaySummaryView.totalFinalPrice).toBe(todayFinalPrice)
      expect(todaySummaryView.totalPrice).toBe(todayTotalPrice)
      expect(todaySummaryView.totalServiceWeight).toBe(todayServicesWeight)

      const { results: past } = await appointmentsService.findAll({
        attendantId: attendant1.id,
        limit: 1000,
        status: EAppointmentStatuses.FINISHED,
        sortBy: 'createdAt',
        order: 'asc',
        fromDate: pastDate
      })

      const pastSummaryView = new AppointmentSummaryView(past)
      const pastFinalServicesPrice = updatedPastAppointments.reduce((total, appointment) => {
        return total + appointment.finalServicesPrice
      }, 0)
      const pastFinalProductsPrice = updatedPastAppointments.reduce((total, appointment) => {
        return total + appointment.finalProductsPrice
      }, 0)
      const pastServicesWeight = updatedPastAppointments.reduce((total, appointment) => {
        return total + appointment.totalServiceWeight
      }, 0)
      const pastTotalPrice = pastFinalServicesPrice + pastFinalProductsPrice
      const pastDiscount = updatedPastAppointments.reduce((total, appointment) => {
        return total + (appointment.discount || 0)
      }, 0)
      const pastFinalPrice = pastTotalPrice - pastDiscount

      expect(pastSummaryView).toBeDefined()
      expect(pastSummaryView.attendantId).toBe(attendant1.id)
      expect(pastSummaryView.attendantName).toBe(attendant1.name)
      expect(pastSummaryView.finalProductsPrice).toBe(pastFinalProductsPrice)
      expect(pastSummaryView.finalServicesPrice).toBe(pastFinalServicesPrice)
      expect(pastSummaryView.totalAppointments).toBe(10)
      expect(pastSummaryView.totalDiscount).toBe(pastDiscount)
      expect(pastSummaryView.totalFinalPrice).toBe(pastFinalPrice)
      expect(pastSummaryView.totalPrice).toBe(pastTotalPrice)
      expect(pastSummaryView.totalServiceWeight).toBe(pastServicesWeight)

      const { results: rangeResults } = await appointmentsService.findAll({
        attendantId: attendant1.id,
        limit: 1000,
        status: EAppointmentStatuses.FINISHED,
        sortBy: 'createdAt',
        order: 'asc',
        fromDate: pastDate,
        toDate: new Date()
      })

      const rangeSummaryView = new AppointmentSummaryView(rangeResults)

      const rangeFinalServicesPrice = updatedTodayAppointments.reduce((total, appointment) => {
        return total + appointment.finalServicesPrice
      }, 0) + updatedPastAppointments.reduce((total, appointment) => {
        return total + appointment.finalServicesPrice
      }, 0)
      const rangeFinalProductsPrice = updatedTodayAppointments.reduce((total, appointment) => {
        return total + appointment.finalProductsPrice
      }, 0) + updatedPastAppointments.reduce((total, appointment) => {
        return total + appointment.finalProductsPrice
      }, 0)
      const rangeServicesWeight = updatedTodayAppointments.reduce((total, appointment) => {
        return total + appointment.totalServiceWeight
      }, 0) + updatedPastAppointments.reduce((total, appointment) => {
        return total + appointment.totalServiceWeight
      }, 0)
      const rangeTotalPrice = rangeFinalServicesPrice + rangeFinalProductsPrice
      const rangeDiscount = updatedTodayAppointments.reduce((total, appointment) => {
        return total + (appointment.discount || 0)
      }, 0) + updatedPastAppointments.reduce((total, appointment) => {
        return total + (appointment.discount || 0)
      }, 0)
      const rangeFinalPrice = rangeTotalPrice - rangeDiscount

      expect(rangeSummaryView).toBeDefined()
      expect(rangeSummaryView.attendantId).toBe(attendant1.id)
      expect(rangeSummaryView.attendantName).toBe(attendant1.name)
      expect(rangeSummaryView.finalProductsPrice).toBeCloseTo(rangeFinalProductsPrice)
      expect(rangeSummaryView.finalServicesPrice).toBeCloseTo(rangeFinalServicesPrice)
      expect(rangeSummaryView.totalAppointments).toBe(20)
      expect(rangeSummaryView.totalDiscount).toBeCloseTo(rangeDiscount)
      expect(rangeSummaryView.totalFinalPrice).toBeCloseTo(rangeFinalPrice)
      expect(rangeSummaryView.totalPrice).toBeCloseTo(rangeTotalPrice)
      expect(rangeSummaryView.totalServiceWeight).toBe(rangeServicesWeight)

      // Delete appointments and clean up
      for (const appointment of updatedTodayAppointments) {
        await appointmentsService.remove(appointment.id)
      }

      for (const appointment of updatedPastAppointments) {
        await appointmentsService.remove(appointment.id)
      }

      await partnershipsService.remove(partnership1.id)
      await partnershipsService.remove(partnership2.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await servicesService.remove(service4.id)
      await servicesService.remove(service5.id)
      await servicesService.remove(service6.id)
      await productsService.remove(product1.id)
      await productsService.remove(product2.id)
      await productsService.remove(product3.id)
      await productsService.remove(product4.id)
      await productsService.remove(product5.id)
      await usersService.remove({ id: attendant1.id })
    })
  })
})