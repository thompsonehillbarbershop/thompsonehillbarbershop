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
import axios, { AxiosError } from "axios"

const path = require("path")
const fs = require("fs")

describe('Users Module', () => {
  let usersController: UsersController
  let usersServices: UsersService

  const imagePath = path.resolve(__dirname, "mocks", "test_image.png")
  const imageBuffer = fs.readFileSync(imagePath)


  function getRandomUserData(data?: Partial<CreateUserInput>): CreateUserInput {
    return {
      name: data?.name || faker.person.fullName(),
      userName: data?.userName || faker.internet.username(),
      password: data?.password || faker.internet.password({ length: 12 }),
      role: data?.role || faker.helpers.enumValue(EUserRole),
      status: data?.status || faker.helpers.enumValue(EUserStatus),
      profileImage: data?.profileImage || undefined,
      profileImageContentType: data?.profileImageContentType || undefined,
    }
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true
        }),
        FirebaseModule,
        MongoModule
      ]
    }).compile()

    usersController = app.get<UsersController>(UsersController)
    usersServices = app.get<UsersService>(UsersService)
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

    it("should find all users", async () => {
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

    it("should find all users filtering by role", async () => {
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
      const inputData = getRandomUserData({ role: EUserRole.ADMIN, status: EUserStatus.ACTIVE })

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

    it("should not generate a signed URL for a user without an image", async () => {
      const inputData = getRandomUserData({
        profileImageContentType: "image/png",
      })

      // Register user with a profile picture
      const user = await usersServices.create(inputData)
      expect(user).toHaveProperty("id")
      expect(user).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(user.profileImage).toBeFalsy()
      expect(user.profileImageSignedUrl).toBeFalsy()

      await usersServices.remove({ id: user.id })
    })

    it("should not generate a signed URL for a user without an  image content type", async () => {
      const inputData = getRandomUserData({
        profileImage: "test_image.png"
      })

      // Register user with a profile picture
      const user = await usersServices.create(inputData)
      expect(user).toHaveProperty("id")
      expect(user).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(user.profileImage).toBeFalsy()
      expect(user.profileImageSignedUrl).toBeFalsy()

      await usersServices.remove({ id: user.id })
    })


    it("should upload a user image", async () => {
      const inputData = getRandomUserData({
        profileImageContentType: "image/png",
        profileImage: "test_image.png"
      })

      // Register user with a profile picture
      try {
        const user = await usersServices.create(inputData)
        expect(user).toHaveProperty("id")
        expect(user).toHaveProperty("userName", inputData.userName.toLowerCase())
        expect(user.profileImage).toBeTruthy()
        expect(user.profileImageSignedUrl).toBeTruthy()

        if (!user.profileImageSignedUrl) {
          throw new Error("User profile image signed URL is not defined")
        }

        if (!user.profileImage) {
          throw new Error("User profile image is not defined")
        }

        // Upload image using the signed URL
        const response = await axios.put(user.profileImageSignedUrl, imageBuffer, {
          headers: {
            "Content-Type": "image/png",
          }
        })

        expect(response.status).toBe(200)

        // Verify if the image was uploaded successfully with status 200
        const response2 = await axios.get(user.profileImage, {
          responseType: "arraybuffer"
        })

        expect(response2.status).toBe(200)
        expect(response2.headers["content-type"]).toBe("image/png")

        await usersServices.remove({ id: user.id })
      } catch (error) {
        throw new Error(`Error uploading image: ${error}`)
      }
    })

    it("should update a user image when there is no image before", async () => {
      const inputData = getRandomUserData()

      // Register user with a profile picture
      const user = await usersServices.create(inputData)
      expect(user).toHaveProperty("id")
      expect(user).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(user.profileImage).toBeFalsy()
      expect(user.profileImageSignedUrl).toBeFalsy()

      // Update user with a image using the signed URL
      const updatedData: UpdateUserInput = {
        profileImage: "test_image.png",
        profileImageContentType: "image/png",
      }
      const updatedUser = await usersServices.update({ id: user.id }, updatedData)

      expect(updatedUser).toHaveProperty("id", user.id)
      expect(updatedUser.profileImage).toBeTruthy()
      expect(updatedUser.profileImageSignedUrl).toBeTruthy()

      if (!updatedUser.profileImageSignedUrl) {
        throw new Error("User profile image signed URL is not defined")
      }

      if (!updatedUser.profileImage) {
        throw new Error("User profile image is not defined")
      }

      // Upload image using the signed URL
      await axios.put(updatedUser.profileImageSignedUrl, imageBuffer, {
        headers: {
          "Content-Type": "image/png",
        }
      })

      // Verify if the image was uploaded successfully with status 200
      const response = await axios.get(updatedUser.profileImage, {
        responseType: "arraybuffer"
      })

      expect(response.status).toBe(200)
      expect(response.headers["content-type"]).toBe("image/png")

      await usersServices.remove({ id: user.id })
    })

    it("should update a user image when there is image before", async () => {
      const inputData = getRandomUserData({
        profileImage: "test_image.png",
        profileImageContentType: "image/png",
      })

      // Register user with a profile picture
      const user = await usersServices.create(inputData)
      expect(user).toHaveProperty("id")
      expect(user).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(user.profileImage).toBeTruthy()
      expect(user.profileImageSignedUrl).toBeTruthy()

      if (!user.profileImageSignedUrl) {
        throw new Error("User profile image signed URL is not defined")
      }
      if (!user.profileImage) {
        throw new Error("User profile image is not defined")
      }

      // Upload image using the signed URL
      await axios.put(user.profileImageSignedUrl, imageBuffer, {
        headers: {
          "Content-Type": "image/png",
        }
      })

      // Update user with a image using the signed URL
      const updatedData: UpdateUserInput = {
        profileImage: "test_image.png",
        profileImageContentType: "image/png",
      }
      const updatedUser = await usersServices.update({ id: user.id }, updatedData)

      expect(updatedUser).toHaveProperty("id", user.id)
      expect(updatedUser.profileImage).toBeTruthy()
      expect(updatedUser.profileImageSignedUrl).toBeTruthy()

      if (!updatedUser.profileImageSignedUrl) {
        throw new Error("User profile image signed URL is not defined")
      }

      if (!updatedUser.profileImage) {
        throw new Error("User profile image is not defined")
      }

      // Upload image using the signed URL
      await axios.put(updatedUser.profileImageSignedUrl, imageBuffer, {
        headers: {
          "Content-Type": "image/png",
        }
      })

      // Verify if the image was uploaded successfully with status 200
      const response = await axios.get(updatedUser.profileImage, {
        responseType: "arraybuffer"
      })

      expect(response.status).toBe(200)
      expect(response.headers["content-type"]).toBe("image/png")

      await usersServices.remove({ id: user.id })
    })

    it("should delete a uploaded user image when user is deleted", async () => {
      const inputData = getRandomUserData({
        profileImageContentType: "image/png",
        profileImage: "test_image.png"
      })

      // Register user with a profile picture
      const user = await usersServices.create(inputData)
      expect(user).toHaveProperty("id")
      expect(user).toHaveProperty("userName", inputData.userName.toLowerCase())
      expect(user).toHaveProperty("profileImage")
      expect(user).toHaveProperty("profileImageSignedUrl")

      if (!user.profileImageSignedUrl) {
        throw new Error("User profile image signed URL is not defined")
      }

      if (!user.profileImage) {
        throw new Error("User profile image is not defined")
      }

      // Upload image using the signed URL
      await axios.put(user.profileImageSignedUrl, imageBuffer, {
        headers: {
          "Content-Type": "image/png",
        }
      })

      // Verify if the image was uploaded successfully with status 200
      const response = await axios.get(user.profileImage, {
        responseType: "arraybuffer"
      })

      expect(response.status).toBe(200)
      expect(response.headers["content-type"]).toBe("image/png")

      // Delete user
      await usersServices.remove({ id: user.id })

      // Verify if the image was deleted successfully with status 403
      // Wait for 5 seconds to allow the image to be deleted
      // await new Promise(resolve => setTimeout(resolve, 5000))

      try {
        const response2 = await axios.get(user.profileImage, {
          responseType: "arraybuffer"
        })
        expect(response2.status).toBe(404)
      } catch (error) {
        const axiosError = error as AxiosError
        expect(axiosError.response?.status).toBe(404)
      }
    })
  })
})
