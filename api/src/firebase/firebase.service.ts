import { Injectable, Inject } from '@nestjs/common'
import * as admin from 'firebase-admin'

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_ADMIN') private readonly app: admin.app.App) { }

  getAuth() {
    return this.app.auth()
  }

  getFirestore() {
    return this.app.firestore()
  }

  getMessaging() {
    return this.app.messaging()
  }

}
