import { Injectable, UnauthorizedException } from '@nestjs/common'
import { IUser, User } from "./entities/user.entity"
import { randomUUID } from "crypto"
import { CreateUserInput } from "./dto/create-user.input"
import { UpdateUserInput } from "./dto/update-user.input"
import { hash, verify } from "argon2"
import { InvalidCredentialsException, UserAlreadyExistsException, UserNotFoundException } from "../errors/index"
import { FirebaseService } from "../firebase/firebase.service"

@Injectable()
export class UsersService {
  private firestore = this.firebaseService.getFirestore();
  private usersCollection = this.firestore.collection('users');

  constructor(
    private readonly firebaseService: FirebaseService,
  ) { }

  async create(createUserDto: CreateUserInput): Promise<User> {
    try {
      await this.findOne({ userName: createUserDto.userName })
      throw new UserAlreadyExistsException()

    } catch (error) {
      if (error instanceof UserNotFoundException) {
        const password = await hash(createUserDto.password)
        const user = new User({
          id: randomUUID(),
          name: createUserDto.name,
          userName: createUserDto.userName,
          password,
          role: createUserDto.role,
          createdAt: new Date()
        })

        await this.usersCollection.doc(user.id).set({ ...user, createdAt: user.createdAt.getTime() })
        return user
      }
      console.error(error)
      throw error
    }
  }

  async findAll(): Promise<User[]> {
    const snapshot = await this.usersCollection.get()
    return snapshot.docs.map((doc) => new User(doc.data() as IUser))
  }

  async findOne({ id, userName }: { id?: string, userName?: string }): Promise<User> {
    if (id) {
      const doc = await this.usersCollection.doc(id).get()
      if (!doc.exists) throw new UserNotFoundException()
      return new User(doc.data() as IUser)
    }

    if (userName) {
      const snapshot = await this.usersCollection
        .where('userName', '==', userName)
        .limit(1)
        .get()

      if (snapshot.empty) throw new UserNotFoundException()
      return new User(snapshot.docs[0].data() as IUser)
    }

    throw new UserNotFoundException()
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

    await this.usersCollection.doc(user.id).set({ ...updatedUser, createdAt: user.createdAt.getTime() })
    return updatedUser
  }

  async remove({ id, userName }: { id?: string, userName?: string }): Promise<User> {
    const user = await this.findOne({ id, userName })
    await this.usersCollection.doc(user.id).delete()
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
