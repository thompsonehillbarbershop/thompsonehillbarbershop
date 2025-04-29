import { Injectable, UnauthorizedException } from '@nestjs/common'
import { User } from "./entities/user.entity"
import { randomUUID } from "crypto"
import { CreateUserInput } from "./dto/create-user.input"
import { UpdateUserInput } from "./dto/update-user.input"
import { hash, verify } from "argon2"
import { InvalidCredentialsException, UserAlreadyExistsException, UserNotFoundException } from "../errors/index"

@Injectable()
export class UsersService {

  private users: User[] = []

  async create(createUserDto: CreateUserInput) {
    try {
      await this.findOne({ userName: createUserDto.userName })
      throw new UserAlreadyExistsException()

    } catch (error) {
      const password = await hash(createUserDto.password)

      if (error instanceof UserNotFoundException) {
        const user = new User({
          id: randomUUID(),
          name: createUserDto.name,
          userName: createUserDto.userName,
          password,
        })
        this.users.push(user)

        return user
      }
      console.error(error)
      throw error
    }
  }

  async findAll() {
    return this.users
  }

  async findOne({ id, userName }: { id?: string, userName?: string }) {
    const user = this.users.find(user => user.id === id || user.userName === userName)
    if (!user) throw new UserNotFoundException()
    return user
  }

  async update({ id, userName }: { id?: string, userName?: string }, updateUserDto: UpdateUserInput) {
    const user = await this.findOne({ id, userName })

    const password = updateUserDto.password ? await hash(updateUserDto.password) : user.password

    const userIndex = this.users.findIndex(user => user.id === id)
    const updatedUser = { ...user, ...updateUserDto, password }
    this.users[userIndex] = updatedUser
    return updatedUser
  }

  async remove({ id, userName }: { id?: string, userName?: string }) {
    const foundUser = await this.findOne({ id, userName })
    const userIndex = this.users.findIndex(user => user.id === foundUser.id)
    this.users.splice(userIndex, 1)
    return foundUser
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
