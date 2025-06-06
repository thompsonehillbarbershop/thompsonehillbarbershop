import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { UsersService } from "../users/users.service"
import { JwtModule } from "@nestjs/jwt"
import { InvalidCredentialsException, UserRegisterException } from "../errors"
import { ConfigModule } from "@nestjs/config"
import { MongoModule } from "../mongo/mongo.module"
import { FirebaseModule } from "../firebase/firebase.module"
import { getRandomUserData } from "../users/mocks"

describe('AuthController', () => {
  let authController: AuthController
  let usersService: UsersService
  let app: TestingModule

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, UsersService],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        JwtModule.registerAsync({
          global: true,
          useFactory: async () => ({
            secret: "32fsdf34faf",
            signOptions: { expiresIn: '60s' },
          })
        }),
        MongoModule,
        FirebaseModule
      ]
    }).compile()

    authController = app.get<AuthController>(AuthController)
    usersService = app.get<UsersService>(UsersService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Auth Module Test', () => {
    it('should be defined', () => {
      expect(authController).toBeDefined()
      expect(usersService).toBeDefined()
    })

    it("should return a token after registering a user", async () => {
      const input = getRandomUserData()

      const response = await authController.register(input)

      expect(response).toHaveProperty("id")
      expect(response).toHaveProperty("userName", input.userName.toLocaleLowerCase())
      expect(response).toHaveProperty("token")

      await usersService.remove({ id: response.id })
    })

    it("should return error if user already exists", async () => {
      const input = getRandomUserData()

      const response = await authController.register(input)
      expect(response).toHaveProperty("id")

      try {
        const response2 = await authController.register(input)
        expect(response2).toBeFalsy()
      } catch (error) {
        expect(error).toBeInstanceOf(UserRegisterException)
      }

      await usersService.remove({ id: response.id })
    })

    it("should login with valid credentials", async () => {
      const input = getRandomUserData()

      const response = await authController.register(input)
      expect(response).toHaveProperty("id")
      expect(response).toHaveProperty("userName", input.userName.toLowerCase())
      expect(response).toHaveProperty("token")

      const loginResponse = await authController.login({
        userName: input.userName,
        password: input.password,
      })

      expect(loginResponse).toHaveProperty("id")
      expect(loginResponse).toHaveProperty("userName", input.userName.toLowerCase())
      expect(loginResponse).toHaveProperty("token")

      await usersService.remove({ id: response.id })
    })

    it("should return error if user not found", async () => {
      try {
        const response = await authController.login({ userName: "invalidUser", password: "invalidPassword" })
        expect(response).toBeFalsy()
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidCredentialsException)
      }
    })

    it("should return error if password is invalid", async () => {
      const input = getRandomUserData()

      const response = await authController.register(input)
      expect(response).toHaveProperty("id")
      expect(response).toHaveProperty("userName", input.userName.toLowerCase())
      expect(response).toHaveProperty("token")

      try {
        const loginResponse = await authController.login({
          userName: input.userName,
          password: "invalidPassword",
        })
        expect(loginResponse).toBeFalsy()
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidCredentialsException)
      }

      await usersService.remove({ id: response.id })
    })
  })
})
