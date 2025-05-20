import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { MongoModule } from "./mongo/mongo.module"
import { ConfigModule } from '@nestjs/config'
import { UsersModule } from "./users/users.module"
import { AuthModule } from "./auth/auth.module"
import { ServicesModule } from './services/services.module'
import { CustomersModule } from './customers/customers.module'
import { AppointmentsModule } from './appointments/appointments.module'
import { FirebaseModule } from "./firebase/firebase.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    FirebaseModule,
    MongoModule,
    UsersModule,
    AuthModule,
    ServicesModule,
    CustomersModule,
    AppointmentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
