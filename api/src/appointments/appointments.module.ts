import { Module } from '@nestjs/common'
import { AppointmentsService } from './appointments.service'
import { AppointmentsController } from './appointments.controller'
import { CustomersModule } from "src/customers/customers.module"
import { ServicesModule } from "src/services/services.module"
import { UsersModule } from "src/users/users.module"
import { ProductsModule } from "src/products/products.module"
import { PartnershipsModule } from "src/partnerships/partnerships.module"
import { AuthModule } from "src/auth/auth.module"
import { SettingsModule } from "src/settings/settings.module"

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  imports: [
    CustomersModule,
    ServicesModule,
    UsersModule,
    ProductsModule,
    PartnershipsModule,
    SettingsModule,
    AuthModule
  ],
  exports: [AppointmentsService]
})
export class AppointmentsModule { }
