import { Module } from '@nestjs/common'
import { CustomersService } from './customers.service'
import { CustomersController } from './customers.controller'
import { PartnershipsModule } from "../partnerships/partnerships.module"
import { AuthModule } from "../auth/auth.module"

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
  imports: [PartnershipsModule, AuthModule]
})
export class CustomersModule { }
