import { Injectable, UnauthorizedException } from '@nestjs/common'
import { UsersService } from "../users/users.service"
import { CreateUserInput } from "../users/dto/create-user.input"
import { AuthView } from "./dto/auth.view"
import { AuthLoginInput } from "./dto/auth-login.input"
import { JwtService } from "@nestjs/jwt"

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }

  async register(data: CreateUserInput): Promise<AuthView> {
    const user = await this.usersService.create(data)
    const token = await this.generateToken(user.id)
    return new AuthView(user, token)
  }

  async login(data: AuthLoginInput): Promise<AuthView> {
    const user = await this.usersService.loginWithCredentials(data.userName, data.password)
    const token = await this.generateToken(user.id)

    return new AuthView(user, token)
  }

  private async generateToken(userId: string) {
    const payload = { sub: userId }
    const accessToken = await this.jwtService.signAsync(payload)
    return accessToken
  }

  async validateJWTUser(id: string) {
    try {
      const user = await this.usersService.findOne({ id })
      if (!user) throw new UnauthorizedException("Token JWT inválido")
      return { id: user.id }
    } catch (error) {
      console.error(error)
      throw new UnauthorizedException("Token JWT inválido")
    }
  }
}