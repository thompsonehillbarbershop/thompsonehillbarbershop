import { Injectable, UnauthorizedException } from '@nestjs/common'
import { User } from "./entities/user.entity"
import { randomUUID } from "crypto"
import { CreateUserInput } from "./dto/create-user.input"
import { UpdateUserInput } from "./dto/update-user.input"
import { verify } from "argon2"

@Injectable()
export class UsersService {

  private users: User[] = []

  create(createUserDto: CreateUserInput) {
    const user = new User({
      id: randomUUID(),
      name: createUserDto.name,
      userName: createUserDto.userName,
      password: createUserDto.password,
    })
    this.users.push(user)

    return user
  }

  findAll() {
    return this.users
  }

  findOne({ id, userName }: { id?: string, userName?: string }) {
    const user = this.users.find(user => user.id === id || user.userName === userName)
    if (!user) throw new UnauthorizedException("Usuário não encontrado")
    return user
  }

  update({ id, userName }: { id?: string, userName?: string }, updateUserDto: UpdateUserInput) {
    const user = this.findOne({ id, userName })
    const userIndex = this.users.findIndex(user => user.id === id)
    const updatedUser = { ...user, ...updateUserDto }
    this.users[userIndex] = updatedUser
    return updatedUser
  }

  remove({ id, userName }: { id?: string, userName?: string }) {
    const user = this.findOne({ id, userName })
    const userIndex = this.users.findIndex(user => user.id === id)
    this.users.splice(userIndex, 1)
    return user
  }

  async loginWithCredentials(userName: string, password: string): Promise<User> {
    try {
      const user = this.findOne({ userName })
      if (!user) throw new UnauthorizedException("Nome de usuário ou senha inválidos")

      const passwordValid = await verify(user?.password || "wrong", password)
      if (!user || !passwordValid) throw new UnauthorizedException("Nome de usuário ou senha inválidos")

      return user
    } catch (error) {
      console.error(error)
      if (error instanceof TypeError) { throw new UnauthorizedException("Nome de usuário ou senha inválidos") }
      throw error
    }
  }
}
