import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { Request } from "express"
import { UsersService } from "../users.service"
import { EUserRole } from "../entities/user.entity"

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    try {
      const user = this.extractUserIdFromRequest(request as Request)
      // @ts-ignore
      const user2 = await this.usersService.findOne({ id: user?.id })
      return (user2?.role === EUserRole.ADMIN || user2?.role === EUserRole.MANAGER)
    } catch (error) {
      console.error(error)
      return false
    }
  }

  private extractUserIdFromRequest(request: Request) {
    // @ts-ignore
    const user = request.user
    return user
  }
}