interface IUser {
  id: string
  name: string
  userName: string
  password: string
}

export class User {
  id: string
  name: string
  userName: string
  password: string

  constructor(data: IUser) {
    Object.assign(this, data)
  }
}
