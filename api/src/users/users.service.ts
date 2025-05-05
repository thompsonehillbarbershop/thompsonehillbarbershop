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
        }

        const user = new this.userSchema({
          _id: id,
          name: createUserDto.name,
          userName: createUserDto.userName.toLowerCase().trim(),
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

    const updatedUser: User = {
      ...user,
      ...updateUserDto,
      password: updatedPassword,
    }

    const updatedUserFromDB = await this.userSchema.findOneAndUpdate(
      { _id: user.id }
      ,
      updatedUser,
      { new: true }
    )
    return toUser(updatedUserFromDB!)
  }

  async remove({ id, userName }: { id?: string, userName?: string }): Promise<User> {
    const user = await this.findOne({ id, userName })
    await this.userSchema.findOneAndDelete({ _id: user.id })
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
