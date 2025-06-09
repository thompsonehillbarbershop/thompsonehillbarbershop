import { Inject, Injectable } from '@nestjs/common'
import { EUserRole, EUserStatus, IUser, User } from "./entities/user.entity"
import { CreateUserInput } from "./dto/create-user.input"
import { UpdateUserInput } from "./dto/update-user.input"
import { hash, verify } from "argon2"
import { InvalidCredentialsException, UserAlreadyExistsException, UserNotFoundException } from "../errors/index"
import { Express } from "express"
import { QueryUserInput } from "./dto/query-user.input"
import { Model } from "mongoose"
import { IMongoUser, toUser } from "../mongo/schemas/user.schema"
import { createId } from "@paralleldrive/cuid2"
import slugify from "slugify"
import { capitalizeName } from "../utils"
import { FirebaseService } from "../firebase/firebase.service"

@Injectable()
export class UsersService {
  constructor(
    @Inject("UserSchema") private readonly userSchema: Model<IMongoUser>,
    private readonly firebaseService: FirebaseService,
  ) { }

  private readonly STORAGE = "users"

  async findOne({ id, userName }: { id?: string, userName?: string }): Promise<User> {
    const query: any = {}
    if (id) query._id = id
    if (userName) query.userName = userName.toLowerCase().trim()

    const user = await this.userSchema.findOne(query)
    if (!user) throw new UserNotFoundException()
    return new User(toUser(user))
  }

  async create(createUserDto: CreateUserInput): Promise<User> {
    try {
      await this.findOne({ userName: createUserDto.userName })
      throw new UserAlreadyExistsException()
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        const password = await hash(createUserDto.password)
        const id = createId()

        const { fileUrl, signedUrl } = await this.firebaseService.createSignedUrl({
          contentType: createUserDto.imageContentType,
          fileName: createUserDto.profileImage,
          folder: this.STORAGE,
          key: id,
        })

        const user = new this.userSchema({
          _id: id,
          name: capitalizeName(createUserDto.name),
          userName: slugify(createUserDto.userName.toLowerCase().trim().replaceAll(/\s/g, ""), { strict: true }),
          password,
          role: createUserDto.role,
          profileImage: fileUrl,
          createdAt: new Date(),
          status: createUserDto.status || EUserStatus.ACTIVE,
        })

        await user.save()

        return new User({ ...{ ...toUser(user) }, imageSignedUrl: signedUrl })
      }
      console.error(error)
      throw error
    }
  }

  async findAll(query?: QueryUserInput): Promise<User[]> {
    let queryConditions: any = {}

    if (query?.role) {
      queryConditions.role = query.role
      queryConditions.deletedAt = null
    }

    const users = await this.userSchema.find(queryConditions)
    return users.filter(user => !user.deletedAt).map(user => new User(toUser(user)))
  }

  async getAvailableAttendants(): Promise<User[]> {
    const users = await this.userSchema.find({
      role: { $in: [EUserRole.ATTENDANT, EUserRole.ATTENDANT_MANAGER] },
      status: EUserStatus.ACTIVE
    })
    return users.filter(user => !user.deletedAt).map(user => new User(toUser(user)))
  }

  async update({ id, userName }: { id?: string, userName?: string }, updateUserDto: UpdateUserInput): Promise<User> {
    const user = await this.findOne({ id, userName })

    const updatedPassword = updateUserDto.password
      ? await hash(updateUserDto.password)
      : user.password

    const { fileUrl, signedUrl } = await this.firebaseService.createSignedUrl({
      contentType: updateUserDto.imageContentType,
      fileName: updateUserDto.profileImage,
      folder: this.STORAGE,
      key: user.id,
    })

    const { delete: deleteUser, ...rest } = updateUserDto

    const updatedUser: User = new User({
      ...user,
      ...rest,
      profileImage: fileUrl,
      password: updatedPassword,
      deletedAt: deleteUser ? new Date() : null,
    })

    const updatedUserFromDB = await this.userSchema.findOneAndUpdate(
      { _id: user.id }
      ,
      updatedUser,
      { new: true }
    )

    const userReturn = toUser(updatedUserFromDB!)
    return new User({ ...userReturn, imageSignedUrl: signedUrl })
  }

  async toggleUserStatus(id: string): Promise<User> {
    const user = await this.findOne({ id })
    const newStatus = user.status === EUserStatus.ACTIVE ? EUserStatus.INACTIVE : EUserStatus.ACTIVE
    const updatedUser = await this.userSchema.findOneAndUpdate(
      { _id: user.id },
      { status: newStatus },
      { new: true }
    )
    if (!updatedUser) throw new UserNotFoundException()
    return new User(toUser(updatedUser))
  }

  async remove({ id, userName }: { id?: string, userName?: string }): Promise<User> {
    const user = await this.findOne({ id, userName })
    await this.userSchema.findOneAndDelete({ _id: user.id })

    // Delete the user profile image from Firebase Storage
    // if (user.profileImage) {
    //   try {
    //     const filePathRaw = `users/${user.userName.toLowerCase().trim()}/profile.${user.profileImage.split('.').pop() || 'jpg'}`

    //     const filePath = typeof filePathRaw === 'string' ? filePathRaw.split("?")[0] : ''

    //     const fileRef = this.firebaseService.getStorage().file(filePath)

    //     await fileRef.delete()
    //   } catch (error) {
    //     console.error("Error deleting file from Firebase Storage:", error, user)
    //     throw new Error("Error deleting file from Firebase Storage")
    //   }
    // }

    return user
  }

  async loginWithCredentials(userName: string, password: string): Promise<User> {
    try {
      const user = await this.findOne({ userName })
      if (!user || !!user.deletedAt) throw new InvalidCredentialsException()

      const passwordValid = await verify(user?.password || "wrong", password)
      if (!user || !passwordValid) throw new InvalidCredentialsException()

      return user
    } catch (error) {
      console.error(error)
      throw new InvalidCredentialsException()
    }
  }
}
