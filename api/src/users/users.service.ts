import { Inject, Injectable } from '@nestjs/common'
import { EUserRole, EUserStatus, IUser, User } from "./entities/user.entity"
import { randomUUID } from "crypto"
import { CreateUserInput } from "./dto/create-user.input"
import { UpdateUserInput } from "./dto/update-user.input"
import { hash, verify } from "argon2"
import { InvalidCredentialsException, UserAlreadyExistsException, UserNotFoundException } from "../errors/index"
import { FirebaseService } from "../firebase/firebase.service"
import { Express } from "express"
import { QueryUserInput } from "./dto/query-user.input"
import { Model } from "mongoose"
import { IMongoUser, toUser } from "../mongo/schemas/user.schema"
import { createId } from "@paralleldrive/cuid2"

@Injectable()
export class UsersService {
  constructor(
    @Inject("UserSchema") private readonly userSchema: Model<IMongoUser>,
    private readonly firebaseService: FirebaseService,
  ) { }

  async findOne({ id, userName }: { id?: string, userName?: string }): Promise<User> {
    const query: any = {}
    if (id) query._id = id
    if (userName) query.userName = userName.toLowerCase().trim()

    const user = await this.userSchema.findOne(query)
    if (!user) throw new UserNotFoundException()
    return toUser(user)
  }

  async create(createUserDto: CreateUserInput): Promise<User> {
    try {
      await this.findOne({ userName: createUserDto.userName })
      throw new UserAlreadyExistsException()
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        const password = await hash(createUserDto.password)
        const id = createId()

        // Create a signed URL for the profile image upload if it exists
        let profileImage: string | undefined = undefined
        let profileImageSignedUrl: string | undefined = undefined
        if (createUserDto.profileImage && createUserDto.profileImageContentType) {
          try {
            const filePath = `users/${createUserDto.userName.toLowerCase().trim()}/profile.${createUserDto.profileImage.split('.').pop() || 'jpg'}`

            const fileRef = this.firebaseService.getStorage().file(filePath)
            const [signedUrl] = await fileRef.getSignedUrl({
              action: 'write',
              expires: Date.now() + 2 * 60 * 1000, // 2 minutes
              contentType: createUserDto.profileImageContentType,
              version: 'v4',
            })
            profileImageSignedUrl = signedUrl

            // Create a url for the profile image public access
            const encodedPath = encodeURIComponent(filePath)
            profileImage = `https://firebasestorage.googleapis.com/v0/b/${this.firebaseService.getStorage().name}/o/${encodedPath}?alt=media`
          } catch (error) {
            console.error("Error generating signed URL:", error)
            throw new Error("Error generating signed URL")
          }
        }

        const user = new this.userSchema({
          _id: id,
          name: createUserDto.name,
          // remove all white spaces and convert to lowercase
          userName: createUserDto.userName.toLowerCase().trim().replaceAll(/\s/g, ""),
          password,
          role: createUserDto.role,
          profileImage,
          createdAt: new Date(),
          status: createUserDto.status || EUserStatus.ACTIVE,
        })

        await user.save()

        return { ...toUser(user), profileImageSignedUrl }
      }
      console.error(error)
      throw error
    }
  }

  async findAll(query?: QueryUserInput): Promise<User[]> {
    let queryConditions: any = {}

    if (query?.role) {
      queryConditions.role = query.role
    }

    const users = await this.userSchema.find(queryConditions)
    return users.map(user => toUser(user))
  }

  async getAvailableAttendants(): Promise<User[]> {
    const users = await this.userSchema.find({
      role: EUserRole.ATTENDANT,
      status: EUserStatus.ACTIVE,
    })
    return users.map(user => toUser(user))
  }

  async update({ id, userName }: { id?: string, userName?: string }, updateUserDto: UpdateUserInput): Promise<User> {
    const user = await this.findOne({ id, userName })

    const updatedPassword = updateUserDto.password
      ? await hash(updateUserDto.password)
      : user.password

    // Check if there is a profile image to upload
    let profileImage: string | undefined = user.profileImage
    let profileImageSignedUrl: string | undefined = undefined
    if (updateUserDto.profileImage && updateUserDto.profileImageContentType) {
      const filePath = `users/${user.userName.toLowerCase().trim()}/profile.${updateUserDto.profileImage.split('.').pop() || 'jpg'}`

      const fileRef = this.firebaseService.getStorage().file(filePath)
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'write',
        expires: Date.now() + 2 * 60 * 1000, // 2 minutes
        contentType: updateUserDto.profileImageContentType,
        version: 'v4',
      })
      profileImageSignedUrl = signedUrl

      // Create a url for the profile image public access
      const encodedPath = encodeURIComponent(filePath)
      profileImage = `https://firebasestorage.googleapis.com/v0/b/${this.firebaseService.getStorage().name}/o/${encodedPath}?alt=media`
    }

    const updatedUser: User = {
      ...user,
      ...updateUserDto,
      password: updatedPassword,
      profileImage
    }

    const updatedUserFromDB = await this.userSchema.findOneAndUpdate(
      { _id: user.id }
      ,
      updatedUser,
      { new: true }
    )

    const userReturn = toUser(updatedUserFromDB!)
    return { ...userReturn, profileImageSignedUrl }
  }

  async remove({ id, userName }: { id?: string, userName?: string }): Promise<User> {
    const user = await this.findOne({ id, userName })
    await this.userSchema.findOneAndDelete({ _id: user.id })

    // Delete the user profile image from Firebase Storage
    if (user.profileImage) {
      try {
        const filePathRaw = `users/${user.userName.toLowerCase().trim()}/profile.${user.profileImage.split('.').pop() || 'jpg'}`

        const filePath = typeof filePathRaw === 'string' ? filePathRaw.split("?")[0] : ''
        const filePath2 = "users/yasmin.harris/profile.png"

        const fileRef = this.firebaseService.getStorage().file(filePath)

        await fileRef.delete()
      } catch (error) {
        console.error("Error deleting file from Firebase Storage:", error, user)
        throw new Error("Error deleting file from Firebase Storage")
      }
    }

    return user
  }

  async loginWithCredentials(userName: string, password: string): Promise<User> {
    try {
      const user = await this.findOne({ userName })
      if (!user) throw new InvalidCredentialsException()

      const passwordValid = await verify(user?.password || "wrong", password)
      if (!user || !passwordValid) throw new InvalidCredentialsException()

      return user
    } catch (error) {
      console.error(error)
      throw new InvalidCredentialsException()
    }
  }
}
