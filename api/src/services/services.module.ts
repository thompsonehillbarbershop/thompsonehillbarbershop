import { Module } from '@nestjs/common'
import { ServicesService } from './services.service'
import { ServicesController } from './services.controller'
import { UsersModule } from "../users/users.module"
import { AuthModule } from "../auth/auth.module"

@Module({
  controllers: [ServicesController],
  providers: [ServicesService],
  imports: [UsersModule, AuthModule],
  exports: [ServicesService],
})
export class ServicesModule { }
