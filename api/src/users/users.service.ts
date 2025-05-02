import { Injectable } from '@nestjs/common'
import { EUserRole, EUserStatus, IUser, User } from "./entities/user.entity"
import { randomUUID } from "crypto"
import { CreateUserInput } from "./dto/create-user.input"
import { UpdateUserInput } from "./dto/update-user.input"
import { hash, verify } from "argon2"
import { InvalidCredentialsException, UserAlreadyExistsException, UserNotFoundException } from "../errors/index"
import { FirebaseService } from "../firebase/firebase.service"
import { Express } from "express"
import { QueryUserInput } from "./dto/query-user.input"

@Injectable()
export class UsersService {
  private firestore = this.firebaseService.getFirestore();
  private usersCollection = this.firestore.collection('users');

  constructor(
    private readonly firebaseService: FirebaseService,
  ) { }

  async create(createUserDto: CreateUserInput, profileImage?: Express.Multer.File): Promise<User> {
    try {
      await this.findOne({ userName: createUserDto.userName })
      throw new UserAlreadyExistsException()
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        const password = await hash(createUserDto.password)
        const id = randomUUID()

        // For firebase upload
        // let profileImageUrl: string = ""
        // if (profileImage) {
        //   profileImageUrl = await this.uploadUserProfileImage(id, profileImage)
        // }
        const user = new User({
          id: id,
          name: createUserDto.name,
          userName: createUserDto.userName.toLowerCase().trim(),
          password,
          role: createUserDto.role,
          profileImage: createUserDto.profileImage || "",
          createdAt: new Date(),
          status: createUserDto.status || EUserStatus.ACTIVE
        })

        await this.usersCollection.doc(user.id).set({ ...user, createdAt: user.createdAt.getTime() })
        return user
      }
      console.error(error)
      throw error
    }
  }

  async findAll(query?: QueryUserInput): Promise<User[]> {
    let ref = this.usersCollection as FirebaseFirestore.Query<IUser>

    if (query?.role) {
      ref = ref.where('role', '==', query.role)
    }

    const snapshot = await ref.get()
    return snapshot.docs.map((doc) => new User(doc.data() as IUser))
  }

  async getAvailableAttendants(): Promise<User[]> {
    const snapshot = await this.usersCollection
      .where('role', '==', EUserRole.ATTENDANT)
      .get()
    return snapshot.docs.filter(doc => (doc.data() as IUser).status === EUserStatus.ACTIVE).map((doc) => new User(doc.data() as IUser))
  }

  async findOne({ id, userName }: { id?: string, userName?: string }): Promise<User> {
    if (id) {
      const doc = await this.usersCollection.doc(id).get()
      if (!doc.exists) throw new UserNotFoundException()
      return new User(doc.data() as IUser)
    }

    if (userName) {
      const snapshot = await this.usersCollection
        .where('userName', '==', userName.toLowerCase().trim())
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

  // private async uploadUserProfileImage(userId: string, file: Express.Multer.File): Promise<string> {
  // Firebase
  // const bucket = this.firebaseService.getStorage()
  // const ext = file.mimetype.split('/')[1]
  // const filename = `users/${userId}.${ext}`

  // console.log("Uploading file to bucket", filename)

  // const fileUpload = bucket.file(filename)

  // const stream = fileUpload.createWriteStream({
  //   metadata: {
  //     contentType: file.mimetype,
  //   },
  // })

  // return new Promise((resolve, reject) => {
  //   stream.on('error', (error) => reject(error))

  //   stream.on('finish', async () => {
  //     await fileUpload.makePublic()
  //     resolve(`https://storage.googleapis.com/${bucket.name}/${filename}`)
  //   })

  //   stream.end(file.buffer)
  // })
  // }
}
