import { Inject, Injectable } from '@nestjs/common'
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
import { setHours, subMinutes } from "date-fns"
import { Model } from "mongoose"
import { IMongoUser } from "./mongo/schemas/user.schema"
import { Parser } from 'json2csv'
import { Response } from "express"
import * as archiver from 'archiver'
import { IMongoCustomer } from "./mongo/schemas/customer.schema"
import { IMongoAppointment } from "./mongo/schemas/appointment.schema"
import { IMongoService } from "./mongo/schemas/service.schema"
import { IMongoPartnership } from "./mongo/schemas/partnership.schema"
import { IMongoProduct } from "./mongo/schemas/product.schema"
import { FirebaseService } from "./firebase/firebase.service"
import { ProductsService } from "./products/products.service"
import { getRandomProductCreateInputData } from "./products/mocks"
import { CreateProductInput } from "./products/dto/create-product.input"

@Injectable()
export class AppService {
  constructor(
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
    private readonly productsService: ProductsService,
    private readonly customersService: CustomersService,
    private readonly appointmentsService: AppointmentsService,
    private readonly configService: ConfigService,
    @Inject("UserSchema") private readonly userSchema: Model<IMongoUser>,
    @Inject("CustomerSchema") private readonly customerSchema: Model<IMongoCustomer>,
    @Inject("AppointmentSchema") private readonly appointmentSchema: Model<IMongoAppointment>,
    @Inject("ServiceSchema") private readonly serviceSchema: Model<IMongoService>,
    @Inject("PartnershipSchema") private readonly partnershipSchema: Model<IMongoPartnership>,
    @Inject("ProductSchema") private readonly productSchema: Model<IMongoProduct>,
    private readonly firebaseService: FirebaseService
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
    // await this.seedProducts()
    // await this.seedCustomers()
    // await this.seedAppointments()
    // await this.seedAppointmentsMass()
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
    await this.usersService.create(getRandomUserData({
      name: "Totem",
      password: "123456",
      role: EUserRole.TOTEM,
      userName: "totem",
      status: EUserStatus.ACTIVE
    }))
    console.log("Attendants seeded...")
  }

  async seedServices() {
    console.log("Seeding services...")
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Corte de cabelo",
      description: "Corte de cabelo em geral",
      value: 50.21,
      promoValue: 40.45,
      promoEnabled: false,
      weight: 1
    }))
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Corte de Barba",
      description: "Barba em geral",
      value: 30.99,
      promoValue: 26.99,
      promoEnabled: false,
      weight: 1
    }))
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Corte + Barba",
      description: "Cabelo e barba em geral",
      value: 70,
      promoValue: 60,
      promoEnabled: true,
      weight: 2
    }))
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Corte de Sobrancelhas",
      description: "Sobrancelha em geral",
      value: 20.32,
      promoValue: 15.13,
      promoEnabled: false,
      weight: 1
    }))
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Depilação de Nariz",
      description: "Nariz em geral",
      value: 10.87,
      promoValue: 8.77,
      weight: 1
    }))
    await this.servicesService.create(getRandomServiceCreateInputData({
      name: "Depilação de Orelha",
      description: "Orelha em geral",
      value: 10.08,
      promoValue: 8.46,
      weight: 1
    }))
    console.log("Services seeded...")
  }

  async seedProducts() {
    console.log("Seeding products...")

    const products: CreateProductInput[] = [
      {
        name: "Shampoo Anticaspa",
        description: "Shampoo para controle de caspa e oleosidade",
        value: 24.90,
        promoValue: 19.90,
        promoEnabled: true,
      },
      {
        name: "Pomada Modeladora",
        description: "Pomada com efeito seco e fixação forte",
        value: 39.90,
        promoValue: 34.90,
        promoEnabled: true,
      },
      {
        name: "Cera Capilar",
        description: "Cera para penteados com brilho natural",
        value: 32.00,
        promoValue: 32.00,
        promoEnabled: false,
      },
      {
        name: "Óleo para Barba",
        description: "Óleo hidratante para barba com fragrância amadeirada",
        value: 45.50,
        promoValue: 39.90,
        promoEnabled: true,
      },
      {
        name: "Balm Pós-Barba",
        description: "Loção calmante para uso após o barbear",
        value: 28.00,
        promoValue: 23.00,
        promoEnabled: true,
      },
      {
        name: "Espuma de Barbear",
        description: "Espuma suave que facilita o deslizar da lâmina",
        value: 21.99,
        promoValue: 17.99,
        promoEnabled: true,
      },
      {
        name: "Shampoo para Barba",
        description: "Limpa e amacia os fios da barba",
        value: 27.50,
        promoValue: 24.90,
        promoEnabled: true,
      },
      {
        name: "Condicionador Masculino",
        description: "Hidrata e fortalece os fios",
        value: 26.90,
        promoValue: 22.90,
        promoEnabled: true,
      },
      {
        name: "Pente de Madeira",
        description: "Pente artesanal ideal para barbas médias e longas",
        value: 18.00,
        promoValue: 15.00,
        promoEnabled: false,
      },
      {
        name: "Toalha de Rosto Personalizada",
        description: "Toalha felpuda com logo da barbearia",
        value: 22.00,
        promoValue: 19.00,
        promoEnabled: false,
      },
      {
        name: "Kit Cuidados com a Barba",
        description: "Kit com shampoo, óleo e balm para barba",
        value: 89.90,
        promoValue: 79.90,
        promoEnabled: true,
      },
      {
        name: "Gel Refrescante Pós-Barba",
        description: "Sensação de frescor e alívio após o barbear",
        value: 30.00,
        promoValue: 25.00,
        promoEnabled: true,
      },
      {
        name: "Escova para Barba",
        description: "Escova de cerdas naturais para alinhar os fios",
        value: 35.00,
        promoValue: 31.50,
        promoEnabled: true,
      },
      {
        name: "Cera para Bigode",
        description: "Modela e dá forma ao bigode com fixação média",
        value: 29.00,
        promoValue: 26.00,
        promoEnabled: true,
      },
      {
        name: "Colônia Masculina",
        description: "Fragrância marcante e sofisticada",
        value: 59.90,
        promoValue: 49.90,
        promoEnabled: true,
      }
    ]

    for (const product of products) {
      await this.productsService.create(getRandomProductCreateInputData(product))
    }

    console.log("Products seeded...")
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
    const products = await this.productsService.findAll()
    const attendants = await this.usersService.getAvailableAttendants()

    const appointments: Appointment[] = []

    for (let i = 0; i < 15; i++) {
      const appointment = await this.appointmentsService.create({
        customerId: faker.helpers.arrayElement(customers).id,
        attendantId: faker.helpers.arrayElement(attendants).id,
        serviceIds: [faker.helpers.arrayElement(services).id],
        productIds: [faker.helpers.arrayElement(products).id],
        createdAt: faker.date.between({
          from: subMinutes(new Date(), 50),
          to: new Date()
        }),
      })
      appointments.push(appointment)
    }

    console.log("Appointments seeded...")
  }

  async seedAppointmentsMass() {
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

  async exportCSV(res: Response): Promise<void> {
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename=thompson_hill_export.zip',
    })

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(res)

    const collections = [
      { name: 'users', model: this.userSchema, excludeFields: ["password", "status"] },
      { name: 'customers', model: this.customerSchema },
      { name: 'appointments', model: this.appointmentSchema },
      { name: 'services', model: this.serviceSchema },
      { name: 'partnerships', model: this.partnershipSchema },
      { name: 'products', model: this.productSchema }
    ]

    for (const col of collections) {
      // @ts-ignore unknown schema type
      const data = await col.model.find().lean()

      if (data.length > 0) {
        // Sanitize data by excluding specified fields
        const sanitizedData = data.map((doc) => {
          const clone = { ...doc }
          if (col.excludeFields) {
            for (const field of col.excludeFields) {
              delete clone[field]
            }
          }
          return clone
        })

        const fields = Object.keys(sanitizedData[0])
        const parser = new Parser({ fields })
        const csv = parser.parse(sanitizedData)
        archive.append(csv, { name: `${col.name}.csv` })
      }
    }

    await archive.finalize()
  }

  private async restoreFirebase() {
    return await this.firebaseService.deleteAllAppointments()
  }

  async cleanup() {
    await this.restoreFirebase()
    return
  }
}
