import { Module } from '@nestjs/common'
import { AppointmentsService } from './appointments.service'
import { AppointmentsController } from './appointments.controller'
import { CustomersModule } from "src/customers/customers.module"
import { ServicesModule } from "src/services/services.module"
import { UsersModule } from "src/users/users.module"

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  imports: [CustomersModule, ServicesModule, UsersModule]
})
export class AppointmentsModule { }
