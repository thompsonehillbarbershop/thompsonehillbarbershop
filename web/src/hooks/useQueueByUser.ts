import { db } from "@/lib/firebase"
import { IFirebaseAppointment } from "@/models/firebase-appointment"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
import { useEffect, useState } from "react"

export function useQueueByUser(userName?: string, statusList?: string[]) {
  const [queue, setQueue] = useState<IFirebaseAppointment[]>([])

  useEffect(() => {
    if (!userName) return

    let q = query(
      collection(db, "queue", userName, "appointments"),
      orderBy("createdAt", "asc")
    )

    // Se quiser filtrar por múltiplos status
    if (statusList && statusList.length > 0) {
      // O Firestore só permite um único `where` para o mesmo campo com operador `in`
      q = query(
        collection(db, "queue", userName, "appointments"),
        where("status", "in", statusList),
        orderBy("createdAt", "asc")
      )
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newQueue = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      setQueue(newQueue)
    })

    return () => unsubscribe()
  }, [userName, JSON.stringify(statusList)]) // JSON.stringify para garantir atualização do efeito

  return queue
}
