import { Module } from '@nestjs/common'
import { PartnershipsService } from './partnerships.service'
import { PartnershipsController } from './partnerships.controller'
import { UsersModule } from "../users/users.module"
import { AuthModule } from "../auth/auth.module"

@Module({
  controllers: [PartnershipsController],
  providers: [PartnershipsService],
  imports: [UsersModule, AuthModule],
  exports: [PartnershipsService],
})
export class PartnershipsModule { }
