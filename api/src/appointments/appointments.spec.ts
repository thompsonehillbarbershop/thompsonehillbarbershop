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
import { EAppointmentStatuses, EPaymentMethod } from "./entities/appointment.entity"
import { AppointmentNotFoundException, CustomerNotFoundException, MissingServicesException, ServiceNotFoundException, UserNotFoundException } from "../errors"
import { FirebaseModule } from "../firebase/firebase.module"
import { UpdateServiceInput } from "src/services/dto/update-service.input"

describe("Appointment Module", () => {
  let appointmentsService: AppointmentsService
  let usersService: UsersService
  let servicesService: ServicesService
  let customersService: CustomersService
  let app: TestingModule

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
        CustomersModule
      ]
    }).compile()

    appointmentsService = app.get<AppointmentsService>(AppointmentsService)
    usersService = app.get<UsersService>(UsersService)
    customersService = app.get<CustomersService>(CustomersService)
    servicesService = app.get<ServicesService>(ServicesService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe("AppointmentsService", () => {
    it("should be defined", () => {
      expect(usersService).toBeDefined()
      expect(servicesService).toBeDefined()
      expect(customersService).toBeDefined()
      expect(appointmentsService).toBeDefined()
    })

    it("should create an appointment with a customer, attendant and one service", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id]
      })

      expect(appointment).toBeDefined()
      expect(appointment.customer.id).toBe(customer.id)
      expect(appointment.customer.name).toBe(customer.name)
      expect(appointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(appointment.attendant?.id).toBe(attendant.id)
      expect(appointment.attendant?.name).toBe(attendant.name)
      expect(appointment.services).toHaveLength(1)
      expect(appointment.totalPrice).toBe(service1.value)
      expect(appointment.finalPrice).toBe(service1.value)
      expect(appointment.discount).toBe(0)
      expect(appointment.status).toBe(EAppointmentStatuses.WAITING)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should create an appointment with a customer, attendant and tree services", async () => {
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

      expect(appointment).toBeDefined()
      expect(appointment.customer.id).toBe(customer.id)
      expect(appointment.customer.name).toBe(customer.name)
      expect(appointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(appointment.attendant?.id).toBe(attendant.id)
      expect(appointment.attendant?.name).toBe(attendant.name)
      expect(appointment.services).toHaveLength(3)
      expect(appointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(appointment.finalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(appointment.discount).toBe(0)
      expect(appointment.status).toBe(EAppointmentStatuses.WAITING)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
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

      await expect(appointmentsService.create({
        customerId: customer.id,
        serviceIds: []
      })).rejects.toThrow(MissingServicesException)

      await customersService.remove(customer.id)
    })

    it("should not create an appointment with a invalid customer", async () => {
      const attendant = await usersService.create(getRandomUserData())

      const service1 = await servicesService.create(getRandomServiceCreateInputData())

      try {
        await appointmentsService.create({
          customerId: "invalid-customer-id",
          attendantId: attendant.id,
          serviceIds: [service1.id]
        })
        fail("Expected CustomerNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(CustomerNotFoundException)
      }

      await servicesService.remove(service1.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not create an appointment with a invalid attendant", async () => {
      const customer = await customersService.create(getRandomCustomerCreateInputData())

      const service1 = await servicesService.create(getRandomServiceCreateInputData())

      try {
        await appointmentsService.create({
          customerId: customer.id,
          attendantId: "invalid-attendant-id",
          serviceIds: [service1.id]
        })
        fail("Expected CustomerNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(UserNotFoundException)
      }

      await servicesService.remove(service1.id)
      await customersService.remove(customer.id)
    })

    it("should not create an appointment with a invalid service", async () => {
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const attendant = await usersService.create(getRandomUserData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())

      try {
        await appointmentsService.create({
          customerId: customer.id,
          attendantId: attendant.id,
          serviceIds: [service1.id, "invalid-service-id"]
        })
        fail("Expected ServiceNotFoundException to be thrown")
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceNotFoundException)
      }
      await servicesService.remove(service1.id)
      await customersService.remove(customer.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should get an appointment", async () => {
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
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment.finalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      await appointmentsService.remove(foundAppointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
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

    it("should get all appointments", async () => {
      const currentAppointments = await appointmentsService.findAll()

      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData())

      const appointment1 = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const appointment2 = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const appointments = await appointmentsService.findAll()

      expect(appointments).toBeDefined()
      expect(appointments).toHaveLength(currentAppointments.length + 2)

      await appointmentsService.remove(appointment1.id)
      await appointmentsService.remove(appointment2.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
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
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const appointment2 = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
      })

      const appointments = await appointmentsService.findAll({ onlyToday: true })

      expect(appointments).toBeDefined()
      expect(appointments).toHaveLength(currentAppointments.length + 2)

      await appointmentsService.remove(appointment1.id)
      await appointmentsService.remove(appointment2.id)
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

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant1.id,
        serviceIds: [service1.id, service2.id, service3.id]
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
      expect(updatedAppointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(updatedAppointment.finalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant2.id)
      expect(foundAppointment.attendant?.name).toBe(attendant2.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment.finalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
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

    it("should update an appointment services and recalculate the total prices", async () => {
      const attendant = await usersService.create(getRandomUserData())
      const customer = await customersService.create(getRandomCustomerCreateInputData())
      const service1 = await servicesService.create(getRandomServiceCreateInputData())
      const service2 = await servicesService.create(getRandomServiceCreateInputData())
      const service3 = await servicesService.create(getRandomServiceCreateInputData({ value: 99.99 }))
      const service4 = await servicesService.create(getRandomServiceCreateInputData({ value: 49.99 }))

      const appointment = await appointmentsService.create({
        customerId: customer.id,
        attendantId: attendant.id,
        serviceIds: [service1.id, service2.id, service3.id]
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
      expect(updatedAppointment.totalPrice).toBeCloseTo(service1.value + service2.value + service4.value)
      expect(updatedAppointment.finalPrice).toBeCloseTo(service1.value + service2.value + service4.value)
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.totalPrice).toBeCloseTo(service1.value + service2.value + service4.value)
      expect(foundAppointment.finalPrice).toBeCloseTo(service1.value + service2.value + service4.value)
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await servicesService.remove(service4.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should not update an appointment with a invalid service", async () => {
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

    it("should update an appointment payment method", async () => {
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
      expect(updatedAppointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(updatedAppointment.finalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(updatedAppointment.discount).toBe(0)
      expect(updatedAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(updatedAppointment.paymentMethod).toBe(EPaymentMethod.PIX)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
      expect(foundAppointment.customer.id).toBe(customer.id)
      expect(foundAppointment.customer.name).toBe(customer.name)
      expect(foundAppointment.customer.phoneNumber).toBe(customer.phoneNumber)
      expect(foundAppointment.attendant?.id).toBe(attendant.id)
      expect(foundAppointment.attendant?.name).toBe(attendant.name)
      expect(foundAppointment.services).toHaveLength(3)
      expect(foundAppointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment.finalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(foundAppointment.discount).toBe(0)
      expect(foundAppointment.status).toBe(EAppointmentStatuses.WAITING)
      expect(foundAppointment.paymentMethod).toBe(EPaymentMethod.PIX)

      await appointmentsService.remove(appointment.id)
      await customersService.remove(customer.id)
      await servicesService.remove(service1.id)
      await servicesService.remove(service2.id)
      await servicesService.remove(service3.id)
      await usersService.remove({ id: attendant.id })
    })

    it("should update an appointment status to ON_SERVICE and set onServiceAt date", async () => {
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

    it("should calculate discount by promo value when enabled (create)", async () => {
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
      expect(appointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(appointment.discount).toBe(service1.value - service1.promoValue! + service3.value - service3.promoValue!)
      expect(appointment.finalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)
      expect(appointment.status).toBe(EAppointmentStatuses.WAITING)

      const foundAppointment = await appointmentsService.findOne(appointment.id)
      expect(foundAppointment).toBeDefined()
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
        promoValue: 10,
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
      expect(updatedAppointment.totalPrice).toBeCloseTo(service1.value + service2.value + service3.value)
      expect(updatedAppointment.discount).toBe(service1.value - service1.promoValue! + service3.value - service3.promoValue!)
      expect(updatedAppointment.finalPrice).toBeCloseTo(service1.promoValue! + service2.value + service3.promoValue!)

      const foundAppointment = await appointmentsService.findOne(appointment.id)

      expect(foundAppointment).toBeDefined()
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
  })
})