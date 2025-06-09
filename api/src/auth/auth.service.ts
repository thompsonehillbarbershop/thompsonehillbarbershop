import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { UsersService } from "../users/users.service"
import { CreateUserInput } from "../users/dto/create-user.input"
import { AuthView } from "./dto/auth.view"
import { AuthLoginInput } from "./dto/auth-login.input"
import { JwtService } from "@nestjs/jwt"
import { UserAlreadyExistsException, UserRegisterException } from "../errors"
import { CreateApiKeyInput } from "./dto/auth-create-api-key.input"
import { IMongoApiKey, toApiKey } from "../mongo/schemas/api-key.schema"
import { Model } from "mongoose"
import { createId } from "@paralleldrive/cuid2"
import { hash, verify } from "argon2"
import { IApiKey } from "./entities/api-key.entity"

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject("ApiKeySchema") private readonly apiKeySchema: Model<IMongoApiKey>,
  ) { }

  async register(data: CreateUserInput): Promise<AuthView> {
    try {
      const user = await this.usersService.create(data)
      const token = await this.generateToken(user.id)
      return new AuthView(user, token)
    } catch (error) {
      if (error instanceof UserAlreadyExistsException) {
        throw new UserRegisterException()
      }
      console.error(error)
      throw error
    }
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

  async createApiKey(dto: CreateApiKeyInput): Promise<IApiKey> {
    const id = createId()
    const apiKey = `api_${id}@@@${createId()}`
    const hashedKey = await hash(apiKey)

    const apiKeyData = new this.apiKeySchema({
      _id: id,
      name: dto.name,
      key: hashedKey,
      createdAt: new Date(),
    })

    await apiKeyData.save()

    return { ...toApiKey(apiKeyData), key: apiKey } // Return the plain key for the client
  }

  async validateApiKey(key: string): Promise<boolean> {
    if (!key || !key.includes('@@@')) {
      throw new UnauthorizedException("Invalid API key format")
    }

    const [id] = key.split('@@@')
    if (!id) {
      throw new UnauthorizedException("Invalid API key format")
    }

    const apiKey = await this.apiKeySchema.findById(id.replace('api_', ''))
    if (!apiKey) {
      throw new UnauthorizedException("API key not found")
    }

    const isValid = await verify(apiKey.key, key)
    if (!isValid) {
      throw new UnauthorizedException("Invalid API key")
    }

    return true
  }

  async listKeys(): Promise<IApiKey[]> {
    const apiKeys = await this.apiKeySchema.find().exec()
    const keys: IApiKey[] = apiKeys.map(apiKey => ({
      id: String(apiKey._id),
      name: apiKey.name,
      key: "",
      createdAt: apiKey.createdAt,
    }))

    return keys
  }

  async deleteApiKey(id: string): Promise<void> {
    const result = await this.apiKeySchema.deleteOne({ _id: id })
    if (result.deletedCount === 0) {
      throw new UnauthorizedException("API key not found")
    }
  }
}