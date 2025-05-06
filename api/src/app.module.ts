import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { MongoModule } from "./mongo/mongo.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),


    AuthModule,
    UsersModule,
    MongoModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
