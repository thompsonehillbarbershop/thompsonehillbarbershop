import { Test, TestingModule } from '@nestjs/testing'
import { UsersController } from "./users.controller"
import { UsersService } from "./users.service"
import { faker } from '@faker-js/faker'
import { CreateUserInput } from "./dto/create-user.input"
import { InvalidCredentialsException, UserAlreadyExistsException, UserNotFoundException } from "../errors"
import { UpdateUserInput } from "./dto/update-user.input"
import { ConfigModule } from "@nestjs/config"
import { EUserRole, EUserStatus } from "./entities/user.entity"
import { MongoModule } from "../mongo/mongo.module"
import { FirebaseModule } from "../firebase/firebase.module"
import { getRandomUserData } from "./mocks"

describe('Users Module', () => {
  let usersController: UsersController
  let usersServices: UsersService
  let app: TestingModule

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        MongoModule,
        FirebaseModule
      ]
    }).compile()

    usersController = app.get<UsersController>(UsersController)
    usersServices = app.get<UsersService>(UsersService)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Services', () => {
    it("should create a new user", async () => {
      const inputData = getRandomUserData()

      const user = await usersServices.create(inputData)

      expect(user).toHaveProperty("id")
      expect(user).toHaveProperty("name", inputData.name)
      expect(user).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(user).toHaveProperty("password")
      expect(user).toHaveProperty("role", inputData.role)
      expect(user).toHaveProperty("status", inputData.status)
      expect(user.profileImage).toBeUndefined()
      expect(user.imageSignedUrl).toBeUndefined()

      await usersServices.remove({ id: user.id })
    })

    it("should create a user with encrypted password", async () => {
      const inputData = getRandomUserData()

      const createdUser = await usersServices.create(inputData)
      const loggedUser = await usersServices.loginWithCredentials(inputData.userName, inputData.password)

      expect(loggedUser).toBeTruthy()
      expect(loggedUser).toHaveProperty("id")
      expect(loggedUser).toHaveProperty("name", inputData.name)
      expect(loggedUser).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(loggedUser).toHaveProperty("password")
      expect(loggedUser).toHaveProperty("role", inputData.role)
      expect(loggedUser).toHaveProperty("status", inputData.status)

      await usersServices.remove({ id: loggedUser.id })
    })

    it("should not create a new user with the same username", async () => {
      const inputData = getRandomUserData()

      await usersServices.create(inputData)

      expect(async () => {
        await usersServices.create(inputData)
      }).rejects.toThrow(UserAlreadyExistsException)

      await usersServices.remove({ userName: inputData.userName })
    })

    it("should find a user by id", async () => {
      const inputData = getRandomUserData()

      const user = await usersServices.create(inputData)
      const foundUser = await usersServices.findOne({ id: user.id })

      expect(foundUser).toHaveProperty("id", user.id)
      expect(foundUser).toHaveProperty("name", inputData.name)
      expect(foundUser).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(foundUser).toHaveProperty("password")
      expect(foundUser).toHaveProperty("role", inputData.role)
      expect(foundUser).toHaveProperty("status", inputData.status)

      await usersServices.remove({ id: user.id })
    })

    it("should not find a user with an invalid id", async () => {
      expect(async () => {
        await usersServices.findOne({ id: "invalid-id" })
      }).rejects.toThrow(UserNotFoundException)
    })

    it("should find a user by username", async () => {
      const inputData = getRandomUserData()

      const user = await usersServices.create(inputData)
      const foundUser = await usersServices.findOne({ userName: user.userName })

      expect(foundUser).toHaveProperty("id", user.id)
      expect(foundUser).toHaveProperty("name", inputData.name)
      expect(foundUser).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(foundUser).toHaveProperty("password")

      await usersServices.remove({ userName: user.userName })
    })

    it("should not find a user with an invalid username", async () => {
      expect(async () => {
        await usersServices.findOne({ userName: "invalid-username" })
      }).rejects.toThrow(UserNotFoundException)
    })

    it.skip("should find all users", async () => {
      const initialUsers = await usersServices.findAll()

      const inputData = Array.from({ length: 5 }, () => getRandomUserData())

      for (const data of inputData) {
        await usersServices.create(data)
      }

      const users = await usersServices.findAll()

      expect(users).toHaveLength(initialUsers.length + inputData.length)
      expect(users).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: expect.any(String),
          userName: expect.any(String),
          password: expect.any(String),
        })
      ]))

      for (const data of inputData) {
        await usersServices.remove({ userName: data.userName })
      }
    }, 30000)

    it.skip("should find all users filtering by role", async () => {
      const initialUsers = await usersServices.findAll()

      const initialAttendants = initialUsers.filter(user => user.role === EUserRole.ATTENDANT)
      const initialManagers = initialUsers.filter(user => user.role === EUserRole.MANAGER)
      const initialAdmins = initialUsers.filter(user => user.role === EUserRole.ADMIN)
      const initialTotems = initialUsers.filter(user => user.role === EUserRole.TOTEM)

      const inputData: CreateUserInput[] = [
        {
          ...getRandomUserData({ role: EUserRole.ATTENDANT })
        },
        {
          ...getRandomUserData({ role: EUserRole.ADMIN })
        },
        {
          ...getRandomUserData({ role: EUserRole.MANAGER })
        },
        {
          ...getRandomUserData({ role: EUserRole.ATTENDANT })
        },
        {
          ...getRandomUserData({ role: EUserRole.TOTEM })
        },
        {
          ...getRandomUserData({ role: EUserRole.ATTENDANT })
        },
        {
          ...getRandomUserData({ role: EUserRole.MANAGER })
        },
        {
          ...getRandomUserData({ role: EUserRole.ATTENDANT })
        },
      ]

      for (const data of inputData) {
        await usersServices.create(data)
      }

      const attendants = await usersServices.findAll({ role: EUserRole.ATTENDANT })
      const managers = await usersServices.findAll({ role: EUserRole.MANAGER })
      const totems = await usersServices.findAll({ role: EUserRole.TOTEM })
      const admins = await usersServices.findAll({ role: EUserRole.ADMIN })

      expect(attendants).toHaveLength(initialAttendants.length + 4)
      expect(managers).toHaveLength(initialManagers.length + 2)
      expect(totems).toHaveLength(initialTotems.length + 1)
      expect(admins).toHaveLength(initialAdmins.length + 1)

      for (const data of inputData) {
        await usersServices.remove({ userName: data.userName })
      }
    }, 30000)

    it("should update a user data by id, without changing password", async () => {
      const inputData = getRandomUserData(
        {
          role: EUserRole.ADMIN,
          status: EUserStatus.ACTIVE,
        })

      const user = await usersServices.create(inputData)

      const updatedData: UpdateUserInput = {
        name: faker.person.fullName(),
        role: EUserRole.MANAGER,
        status: EUserStatus.INACTIVE,
      }

      const loggedUser = await usersServices.loginWithCredentials(inputData.userName, inputData.password)

      expect(loggedUser).toBeTruthy()

      const updatedUser = await usersServices.update({ id: user.id }, updatedData)

      expect(updatedUser).toHaveProperty("id", user.id)
      expect(updatedUser).toHaveProperty("name", updatedData.name)
      expect(updatedUser).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(updatedUser).toHaveProperty("password")
      expect(updatedUser).toHaveProperty("role", updatedData.role)
      expect(updatedUser).toHaveProperty("status", updatedData.status)

      const loggedUser2 = await usersServices.loginWithCredentials(inputData.userName, inputData.password)

      expect(loggedUser2).toBeTruthy()
      expect(loggedUser2).toHaveProperty("id", user.id)
      expect(loggedUser2).toHaveProperty("name", updatedData.name)
      expect(loggedUser2).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(loggedUser2).toHaveProperty("password")
      expect(loggedUser2).toHaveProperty("role", updatedData.role)
      expect(loggedUser2).toHaveProperty("status", updatedData.status)

      await usersServices.remove({ id: user.id })
    })

    it("should update a user data by username, without changing password", async () => {
      const inputData = getRandomUserData()

      const user = await usersServices.create(inputData)

      const updatedData: UpdateUserInput = {
        name: faker.person.fullName(),
      }

      const loggedUser = await usersServices.loginWithCredentials(inputData.userName, inputData.password)

      expect(loggedUser).toBeTruthy()

      const updatedUser = await usersServices.update({ userName: user.userName }, updatedData)

      expect(updatedUser).toHaveProperty("id", user.id)
      expect(updatedUser).toHaveProperty("name", updatedData.name)
      expect(updatedUser).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(updatedUser).toHaveProperty("password")

      const loggedUser2 = await usersServices.loginWithCredentials(inputData.userName, inputData.password)

      expect(loggedUser2).toBeTruthy()

      await usersServices.remove({ id: user.id })
    })


    it("should update and encrypt user password", async () => {
      const inputData = getRandomUserData()

      const user = await usersServices.create(inputData)

      const updatedData: UpdateUserInput = {
        password: faker.internet.password({ length: 12 }),
      }

      const updatedUser = await usersServices.update({ id: user.id }, updatedData)

      expect(updatedUser).toHaveProperty("id", user.id)
      expect(updatedUser).toHaveProperty("name", inputData.name)
      expect(updatedUser).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(updatedUser).toHaveProperty("password")

      expect(async () => {
        await usersServices.loginWithCredentials(inputData.userName, inputData.password)
      }).rejects.toThrow(InvalidCredentialsException)

      const loggedUser = await usersServices.loginWithCredentials(inputData.userName, updatedData.password as string)

      expect(loggedUser).toBeTruthy()

      await usersServices.remove({ id: user.id })
    })

    it("should not update a user with an invalid id", async () => {
      const updatedData: UpdateUserInput = {
        name: faker.person.fullName(),
      }

      expect(async () => {
        await usersServices.update({ id: "invalid-id" }, updatedData)
      }).rejects.toThrow(UserNotFoundException)
    })

    it("should not update a user with an invalid username", async () => {
      const updatedData: UpdateUserInput = {
        name: faker.person.fullName(),
      }

      expect(async () => {
        await usersServices.update({ userName: "invalid-username" }, updatedData)
      }).rejects.toThrow(UserNotFoundException)
    })

    it("should delete a user by id", async () => {
      const inputData = getRandomUserData()

      const user = await usersServices.create(inputData)
      const deletedUser = await usersServices.remove({ id: user.id })

      expect(deletedUser).toHaveProperty("id", user.id)
      expect(deletedUser).toHaveProperty("name", inputData.name)
      expect(deletedUser).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(deletedUser).toHaveProperty("password")
    })

    it("should delete a user by username", async () => {
      const inputData = getRandomUserData()

      const user = await usersServices.create(inputData)
      const deletedUser = await usersServices.remove({ userName: user.userName })

      expect(deletedUser).toHaveProperty("id", user.id)
      expect(deletedUser).toHaveProperty("name", inputData.name)
      expect(deletedUser).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(deletedUser).toHaveProperty("password")
    })

    it("should not delete a user with an invalid id", async () => {
      expect(async () => {
        await usersServices.remove({ id: "invalid-id" })
      }).rejects.toThrow(UserNotFoundException)
    })

    it("should not delete a user with an invalid username", async () => {
      expect(async () => {
        await usersServices.remove({ userName: "invalid-username" })
      }).rejects.toThrow(UserNotFoundException)
    })

    it("should login with valid credentials", async () => {
      const inputData = getRandomUserData()

      const user = await usersServices.create(inputData)
      const loggedUser = await usersServices.loginWithCredentials(inputData.userName, inputData.password)

      expect(loggedUser).toBeTruthy()
      expect(loggedUser).toHaveProperty("id", user.id)
      expect(loggedUser).toHaveProperty("name", inputData.name)
      expect(loggedUser).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(loggedUser).toHaveProperty("password")

      await usersServices.remove({ id: user.id })
    })

    it("should not login with invalid credentials", async () => {
      expect(async () => {
        await usersServices.loginWithCredentials("invalid-username", "invalid-password")
      }).rejects.toThrow(InvalidCredentialsException)
    })

    it("should not login with wrong password", async () => {
      const inputData = getRandomUserData()

      await usersServices.create(inputData)

      expect(async () => {
        await usersServices.loginWithCredentials(inputData.userName, "wrong-password")
      }).rejects.toThrow(InvalidCredentialsException)

      await usersServices.remove({ userName: inputData.userName })
    })
  })
})
