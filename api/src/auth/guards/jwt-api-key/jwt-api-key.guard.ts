// combined-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtAuthGuard } from "../jwt-auth/jwt-auth.guard"
import { ApiKeyGuard } from "../api-key/api-key.guard"
import { AuthService } from "../../auth.service"


@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  private jwtGuard = new JwtAuthGuard();
  private apiKeyGuard = new ApiKeyGuard(this.authService);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      if (await this.apiKeyGuard.canActivate(context)) {
        return true
      }
    } catch (error) {
      // console.error('API Key validation failed:', error)
    }

    try {
      const result = await this.jwtGuard.canActivate(context)
      return !!result
    } catch {
      return false
    }
  }
}
