import { Module } from '@nestjs/common'
import { ProductsController } from './products.controller'
import { ProductsService } from "./products.service"
import { UsersModule } from "../users/users.module"
import { AuthModule } from "../auth/auth.module"

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [UsersModule, AuthModule],
  exports: [ProductsService],
})
export class ProductsModule { }
