import { Injectable } from '@nestjs/common'
import { UsersService } from "./users/users.service"
import { ConfigService } from "@nestjs/config"
import { EUserRole, EUserStatus } from "./users/entities/user.entity"
import { getRandomUserData } from "./users/mocks"
import { ServicesService } from "./services/services.service"
import { getRandomServiceCreateInputData } from "./services/mocks"
import { CustomersService } from "./customers/customers.service"
import { AppointmentsService } from "./appointments/appointments.service"
import { getRandomCustomerCreateInputData } from "./customers/mocks"
import { fakerPT_BR as faker } from '@faker-js/faker'
import { Customer, ECustomerGender } from "./customers/entities/customer.entity"
import { Appointment, EAppointmentStatuses, EPaymentMethod } from "./appointments/entities/appointment.entity"
import { setHours } from "date-fns"

@Injectable()
export class AppService {
  constructor(
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
    private readonly customersService: CustomersService,
    private readonly appointmentsService: AppointmentsService,
    private readonly configService: ConfigService
  ) {
    const userName = this.configService.get("ADMIN_USER")
    const password = this.configService.get("ADMIN_PASSWORD")

    this.usersService.findOne({ userName })
      .then((user) => {
        console.log("Admin user found, updating password...")
        console.log(user)
        this.usersService.update({ id: user.id }, { password })
      })
      .catch((error) => {
        console.log("Admin user not found, creating...")
        this.usersService.create({
          name: "Admin",
          userName,
          password,
          role: EUserRole.ADMIN
        })
          .then(() => {
            console.log("Admin user created")
          })
          .catch((error) => {
            console.log("Error creating admin user", error)
          })
      })

    this.seed()
      .then(() => {
        console.log("Database seeded")
      })
      .catch((error) => {
        console.log("Error seeding database", error)
      })
  }

  async seed() {
    // await this.seedAttendants()
    // await this.seedServices()
    // await this.seedCustomers()
    // await this.seedAppointments()
  }

  async seedAttendants() {
    console.log("Seeding attendants...")
    await this.usersService.create(getRandomUserData({
      name: "José Alberto",
      password: "123456",
      role: EUserRole.ATTENDANT,
      userName: "jalberto",
      status: EUserStatus.ACTIVE
    }))
    await this.usersService.create(getRandomUserData({
      name: "Ana Maria",
      password: "123456",
      role: EUserRole.ATTENDANT,
      userName: "amaria",
      status: EUserStatus.ACTIVE
    }))
    await this.usersService.create(getRandomUserData({
      name: "Carlos Roberto",
      password: "123456",
      role: EUserRole.ATTENDANT,
      userName: "croberto",
      status: EUserStatus.ACTIVE
    }))
    await this.usersService.create(getRandomUserData({
      name: "Maria Clara",
      password: "123456",
      role: EUserRole.ATTENDANT,
      userName: "mclara",
      status: EUserStatus.INACTIVE
    }))
    console.log("Attendants seeded...")
  }

  async seedServices() {
    console.log("Seeding services...")
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Corte de cabelo",
      description: "Corte de cabelo em geral",
      value: 50,
      promoValue: 40,
      promoEnabled: false
    }))
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Corte de Barba",
      description: "Barba em geral",
      value: 30,
      promoValue: 20,
      promoEnabled: false
    }))
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Corte + Barba",
      description: "Cabelo e barba em geral",
      value: 70,
      promoValue: 60,
      promoEnabled: true
    }))
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Corte de Sobrancelhas",
      description: "Sobrancelha em geral",
      value: 20,
      promoValue: 15,
      promoEnabled: false
    }))
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Depilação de Nariz",
      description: "Nariz em geral",
      value: 10,
      promoValue: 8,
    }))
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Depilação de Orelha",
      description: "Orelha em geral",
      value: 10,
      promoValue: 8,
    }))
    console.log("Services seeded...")
  }

  async seedCustomers() {
    console.log("Seeding customers...")

    const customers: Customer[] = []

    for (let i = 0; i < 50; i++) {
      const customer = await this.customersService.create(getRandomCustomerCreateInputData({
        name: faker.person.fullName(),
        birthDate: faker.date.birthdate({ min: 18, max: 60, mode: "age" }),
        phoneNumber: faker.phone.number({ style: "international" }),
        gender: faker.helpers.enumValue(ECustomerGender),
      }))
      customers.push(customer)
    }

    // update customer used referral code
    for (const customer of customers) {
      await this.customersService.update(customer.id, {
        referralCodeUsed: faker.helpers.arrayElement(customers).referralCode,
      })
    }

    console.log("Customers seeded...")
  }

  async seedAppointments() {
    console.log("Seeding appointments...")
    const { results: customers } = await this.customersService.findAll({
      limit: 200
    })
    const services = await this.servicesService.findAll()
    const attendants = await this.usersService.findAll({ role: EUserRole.ATTENDANT })

    const appointments: Appointment[] = []

    for (let i = 0; i < 200; i++) {
      const appointment = await this.appointmentsService.create({
        customerId: faker.helpers.arrayElement(customers).id,
        attendantId: faker.helpers.arrayElement(attendants).id,
        serviceIds: [faker.helpers.arrayElement(services).id],
        createdAt: faker.date.between({
          from: setHours(new Date(), 8),
          to: setHours(new Date(), 20)
        }),
      })
      appointments.push(appointment)
    }

    const updatedAppointments: Appointment[] = []

    // update appointments status
    for (const appointment of appointments) {
      const updated = await this.appointmentsService.update(appointment.id, {
        status: faker.helpers.enumValue(EAppointmentStatuses),
      })
      updatedAppointments.push(updated)
    }

    // update payment method for finished appointments
    for (const appointment of updatedAppointments) {
      if (appointment.status === EAppointmentStatuses.FINISHED) {
        await this.appointmentsService.update(appointment.id, {
          paymentMethod: faker.helpers.enumValue(EPaymentMethod),
        })
      }
    }

    console.log("Appointments seeded...")
  }
}
