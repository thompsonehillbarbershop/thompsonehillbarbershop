import { Injectable, Inject } from '@nestjs/common'
import { ConfigService } from "@nestjs/config"
import * as admin from 'firebase-admin'

@Injectable()
export class FirebaseService {
  constructor(
    @Inject('FIREBASE_ADMIN') private readonly app: admin.app.App,
    private readonly configService: ConfigService,
  ) { }

  // getFirestore() {
  //   return this.app.firestore()
  // }

  getStorage() {
    const bucketName = this.configService.get<string>('FIREBASE_STORAGE_BUCKET_NAME') as string

    // this.app
    //   .storage()
    //   .bucket(bucketName)
    //   .setCorsConfiguration([
    //     {
    //       maxAgeSeconds: 3600,
    //       method: ['GET', 'PUT'],
    //       // origin: ["*"],
    //       origin: ["http://localhost:3000"],
    //       responseHeader: ["Content-Type"],
    //     }
    //   ])
    //   .then(() => {
    //     console.log("CORS configuration set successfully")
    //   })
    //   .catch((error) => {
    //     console.error("Error setting CORS configuration:", error)
    //   })

    // this.app
    //   .storage()
    //   .bucket("thompson-hill-888da.firebasestorage.app")
    //   .setCorsConfiguration([
    //     {
    //       maxAgeSeconds: 3600,
    //       method: ['GET', 'PUT'],
    //       origin: ["*"],
    //     }
    //   ])
    //   .then(() => {
    //     console.log("CORS configuration set successfully")
    //   })
    //   .catch((error) => {
    //     console.error("Error setting CORS configuration:", error)
    //   })

    // this.app.storage().bucket(bucketName).getMetadata()
    //   .then((data) => {
    //     const metadata = data[0]
    //     // console.log("Bucket metadata:", metadata)
    //     console.log("Cors configuration:", metadata.cors)
    //   })


    return this.app
      .storage()
      .bucket(bucketName)
  }
}
