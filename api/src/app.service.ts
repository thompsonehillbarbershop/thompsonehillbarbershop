import { Injectable } from '@nestjs/common'
import { UsersService } from "./users/users.service"
import { ConfigService } from "@nestjs/config"
import { EUserRole } from "./users/entities/user.entity"

@Injectable()
export class AppService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {
    const userName = this.configService.get("ADMIN_USER")
    const password = this.configService.get("ADMIN_PASSWORD")

    this.usersService.findOne({ userName })
      .then((user) => {
        console.log("Admin user found, updating password...")
        console.log(user)
        this.usersService.update({ id: user.id }, { password })
      })
      .catch((error) => {
        console.log("Admin user not found, creating...")
        this.usersService.create({
          name: "Admin",
          userName,
          password,
          role: EUserRole.ADMIN
        })
          .then(() => {
            console.log("Admin user created")
          })
          .catch((error) => {
            console.log("Error creating admin user", error)
          })
      })
  }
}
