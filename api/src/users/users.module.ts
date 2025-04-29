import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  // imports: [PrismaModule],
  exports: [UsersService]
})
export class UsersModule { }
