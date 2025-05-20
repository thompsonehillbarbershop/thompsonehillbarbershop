import { Global, Module } from '@nestjs/common'
import * as mongoose from 'mongoose'
import { Connection, Model } from 'mongoose'
import { ConfigModule, ConfigService } from "@nestjs/config"
import { IMongoUser, userSchema } from "./schemas/user.schema"
import { APPOINTMENT_SCHEMA_NAME, CUSTOMER_SCHEMA_NAME, SERVICE_SCHEMA_NAME, USER_SCHEMA_NAME } from "./constants"
import { IMongoService, serviceSchema } from "./schemas/service.schema"
import { customerSchema, IMongoCustomer } from "./schemas/customer.schema"
import { appointmentSchema, IMongoAppointment } from "./schemas/appointment.schema"

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "MongoConnection",
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Promise<typeof mongoose> => {
        if (mongoose.connection.readyState === 1) {
          return Promise.resolve(mongoose)
        }

        return mongoose.connect(configService.get<string>('MONGODB_URI') as string, {})
      }
    },
    {
      provide: "UserSchema",
      inject: ["MongoConnection"],
      useFactory: (connection: Connection) => {
        const UserSchema: Model<IMongoUser> = connection.models.user || connection.model<IMongoUser>(USER_SCHEMA_NAME, userSchema)

        return UserSchema
      }
    },
    {
      provide: "ServiceSchema",
      inject: ["MongoConnection"],
      useFactory: (connection: Connection) => {
        const ServiceSchema: Model<IMongoService> = connection.models.service || connection.model<IMongoService>(SERVICE_SCHEMA_NAME, serviceSchema)

        return ServiceSchema
      }
    },
    {
      provide: "CustomerSchema",
      inject: ["MongoConnection"],
      useFactory: (connection: Connection) => {
        const CustomerSchema: Model<IMongoCustomer> = connection.models.customer || connection.model<IMongoCustomer>(CUSTOMER_SCHEMA_NAME, customerSchema)

        return CustomerSchema
      }
    },
    {
      provide: "AppointmentSchema",
      inject: ["MongoConnection"],
      useFactory: (connection: Connection) => {
        const AppointmentSchema: Model<IMongoAppointment> = connection.models.appointment || connection.model<IMongoAppointment>(APPOINTMENT_SCHEMA_NAME, appointmentSchema)

        return AppointmentSchema
      }
    }
  ],
  exports: ["UserSchema", "ServiceSchema", "CustomerSchema", "AppointmentSchema"]
})
export class MongoModule { }
