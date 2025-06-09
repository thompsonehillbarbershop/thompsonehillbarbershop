import { Injectable, Inject } from '@nestjs/common'
import * as admin from 'firebase-admin'
import { Appointment } from "../appointments/entities/appointment.entity"

@Injectable()
export class FirebaseService {
  constructor(
    @Inject('FIREBASE_ADMIN') private readonly app: admin.app.App,
  ) { }

  private readonly APPOINTMENTS_COLLECTION = 'appointments'

  getFirestore() {
    return this.app.firestore()
  }

  getStorage() {
    return this.app
      .storage()
      .bucket()
  }

  async createSignedUrl({
    contentType, fileName, folder, key
  }: { fileName?: string, contentType?: string, folder?: string, key?: string }) {
    let fileUrl: string | undefined = undefined
    if (fileName && contentType && folder && key) {
      try {
        const filePath = `${folder}/${key}.${fileName.split('.').pop() || 'jpg'}`

        const fileRef = this.getStorage().file(filePath)
        const [signedUrl] = await fileRef.getSignedUrl({
          action: 'write',
          expires: Date.now() + 2 * 60 * 1000, // 2 minutes
          contentType: contentType,
          version: 'v4',
        })

        const encodedPath = encodeURIComponent(filePath)
        fileUrl = `https://firebasestorage.googleapis.com/v0/b/${this.getStorage().name}/o/${encodedPath}?alt=media`

        return { signedUrl, fileUrl }
      } catch (error) {
        console.error("Error generating signed URL:", error)
        throw new Error("Error generating signed URL")
      }
    }
    return { signedUrl: undefined, fileUrl: undefined }
  }

  async addAppointmentToQueue(appointment: Appointment) {
    // return
    const collectionRef = this.getFirestore().collection(this.APPOINTMENTS_COLLECTION)
    const docRef = collectionRef.doc(appointment.id)
    try {
      await docRef.set({ ...appointment.toFirebaseObject(), createdAt: admin.firestore.Timestamp.fromDate(appointment.createdAt) }, { merge: true })
    } catch (error) {
      console.error('Error adding appointment to queue:', error)
      throw new Error('Error adding appointment to queue')
    }
  }

  async updateAppointment(appointment: Appointment) {
    // return
    const collectionRef = this.getFirestore().collection(this.APPOINTMENTS_COLLECTION)
    const docRef = collectionRef.doc(appointment.id)
    try {
      await docRef.set({ ...appointment.toFirebaseObject(), createdAt: admin.firestore.Timestamp.fromDate(appointment.createdAt) }, { merge: true })
    } catch (error) {
      console.error('Error updating appointment:', error)
      throw new Error('Error updating appointment')
    }
  }

  async deleteAllAppointments(): Promise<void> {
    const collectionRef = this.getFirestore().collection(this.APPOINTMENTS_COLLECTION)

    try {
      const snapshot = await collectionRef.get()

      const batchSize = 500
      if (snapshot.empty) {
        // No appointments to delete
        return
      }

      const deleteBatch = async (docs: FirebaseFirestore.QueryDocumentSnapshot[]) => {
        const batch = this.getFirestore().batch()
        docs.forEach((doc) => batch.delete(doc.ref))
        await batch.commit()
      }

      const docs = snapshot.docs
      for (let i = 0; i < docs.length; i += batchSize) {
        const chunk = docs.slice(i, i + batchSize)
        await deleteBatch(chunk)
      }
    } catch (error) {
      throw new Error('Failed to delete all appointments')
    }
  }

}