import { Global, Module } from '@nestjs/common'
import * as mongoose from 'mongoose'
import { Connection, Model } from 'mongoose'
import { ConfigModule, ConfigService } from "@nestjs/config"
import { IMongoUser, userSchema } from "./schemas/user.schema"
import { USER_SCHEMA_NAME } from "./constants"

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
    }
  ],
  exports: ["UserSchema"]
})
export class MongoModule { }
