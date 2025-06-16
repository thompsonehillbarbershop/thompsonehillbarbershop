import { Global, Module } from '@nestjs/common'
import * as mongoose from 'mongoose'
import { Connection, Model } from 'mongoose'
import { ConfigModule, ConfigService } from "@nestjs/config"
import { IMongoUser, userSchema } from "./schemas/user.schema"
import { APPOINTMENT_SCHEMA_NAME, CUSTOMER_SCHEMA_NAME, SERVICE_SCHEMA_NAME, USER_SCHEMA_NAME, PRODUCT_SCHEMA_NAME, PARTNERSHIP_SCHEMA_NAME, API_KEY_SCHEMA_NAME, SETTINGS_SCHEMA_NAME } from "./constants"
import { IMongoService, serviceSchema } from "./schemas/service.schema"
import { customerSchema, IMongoCustomer } from "./schemas/customer.schema"
import { appointmentSchema, IMongoAppointment } from "./schemas/appointment.schema"
import { IMongoProduct, productSchema } from "./schemas/product.schema"
import { IMongoPartnership, partnershipSchema } from "./schemas/partnership.schema"
import { apiKeySchema, IMongoApiKey } from "./schemas/api-key.schema"
import { IMongoSetting, settingSchema } from "./schemas/settings.schema"

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
      provide: "ProductSchema",
      inject: ["MongoConnection"],
      useFactory: (connection: Connection) => {
        const ProductSchema: Model<IMongoProduct> = connection.models.product || connection.model<IMongoProduct>(PRODUCT_SCHEMA_NAME, productSchema)

        return ProductSchema
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
    },
    {
      provide: "PartnershipSchema",
      inject: ["MongoConnection"],
      useFactory: (connection: Connection) => {
        const PartnershipSchema: Model<IMongoPartnership> = connection.models.partnership || connection.model<IMongoPartnership>(PARTNERSHIP_SCHEMA_NAME, partnershipSchema)

        return PartnershipSchema
      }
    },
    {
      provide: "ApiKeySchema",
      inject: ["MongoConnection"],
      useFactory: (connection: Connection) => {
        const ApiKeySchema: Model<IMongoApiKey> = connection.models.apiKey || connection.model<IMongoApiKey>(API_KEY_SCHEMA_NAME, apiKeySchema)

        return ApiKeySchema
      }
    },
    {
      provide: "SettingSchema",
      inject: ["MongoConnection"],
      useFactory: (connection: Connection) => {
        const SettingSchema: Model<IMongoSetting> = connection.models.setting || connection.model<IMongoSetting>(SETTINGS_SCHEMA_NAME, settingSchema)

        return SettingSchema
      }
    },
  ],
  exports: ["UserSchema", "ServiceSchema", "ProductSchema", "CustomerSchema", "AppointmentSchema", "PartnershipSchema", "ApiKeySchema", "SettingSchema"]
})
export class MongoModule { }
