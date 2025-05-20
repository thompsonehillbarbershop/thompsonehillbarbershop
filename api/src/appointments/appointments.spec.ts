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
  })
})