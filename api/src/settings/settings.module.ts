import { Module } from '@nestjs/common'
import { SettingsService } from './settings.service'
import { SettingsController } from './settings.controller'
import { AuthModule } from "../auth/auth.module"
import { UsersModule } from "../users/users.module"

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
  imports: [AuthModule, UsersModule],
})
export class SettingsModule { }
