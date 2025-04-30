import { Injectable, Inject } from '@nestjs/common'
import * as admin from 'firebase-admin'

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_ADMIN') private readonly app: admin.app.App) { }

  getFirestore() {
    return this.app.firestore()
  }

  getStorage() {
    return this.app.storage().bucket("app")
  }
}
