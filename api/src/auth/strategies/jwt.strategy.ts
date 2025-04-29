import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { AuthService } from "../auth.service"
import { ConfigService } from "@nestjs/config"
import { AuthJwtPayload } from "../types/auth-jwt-payload"
import { Injectable } from "@nestjs/common"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
      ignoreExpiration: false
    })
  }

  async validate(payload: AuthJwtPayload) {
    const userId = payload.sub
    // This return will be available in the request object
    return this.authService.validateJWTUser(userId)
  }
}