import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { AuthService } from "../../auth.service"

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers['x-api-key']

    return this.authService.validateApiKey(apiKey as string)
  }
}