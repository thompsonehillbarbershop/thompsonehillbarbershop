import { db } from "@/lib/firebase"
import { IFirebaseAppointment } from "@/models/firebase-appointment"
import { isSameDay } from "date-fns"
import { collectionGroup, onSnapshot, query } from "firebase/firestore"
import { useEffect, useState } from "react"

export function useQueue() {
  const [queue, setQueue] = useState<Record<string, IFirebaseAppointment[]>>({})
  useEffect(() => {
    const q = query(
      collectionGroup(db, "appointments"),
    )

    // Escuta todos os documentos chamados 'appointments' em qualquer lugar
    const subscriber = onSnapshot(q, (snapshot) => {
      const newQueue = snapshot.docs.map(doc => (
        {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        } as IFirebaseAppointment))

      const today = new Date()
      const filteredQueue = newQueue.filter(appointment => (
        appointment.createdAt && isSameDay(appointment.createdAt, today)
      ))

      // Agrupa os documentos por attendant.userName
      const groupedQueue: Record<string, IFirebaseAppointment[]> = {}

      filteredQueue.forEach((appointment) => {
        const attendantName = appointment.attendant?.userName || "fila_geral"
        if (!groupedQueue[attendantName]) {
          groupedQueue[attendantName] = []
        }
        groupedQueue[attendantName].push(appointment)
      })

      // Inclui todos os atendimentos da fila_geral na fila de todos os atendentes
      const generalQueue = groupedQueue["fila_geral"] || []
      Object.keys(groupedQueue).forEach((attendantName) => {
        if (attendantName !== "fila_geral") {
          groupedQueue[attendantName] = [
            ...(groupedQueue[attendantName] || []),
            ...generalQueue,
          ]
        }
      })

      // Ordena a fila de cada atendente pelo campo 'createdAt' em ordem crescente
      Object.keys(groupedQueue).forEach((attendantName) => {
        groupedQueue[attendantName].sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return a.createdAt.getTime() - b.createdAt.getTime()
          }
          return 0
        })
      })

      setQueue(groupedQueue)
    })

    return () => subscriber()
  }, [])

  return queue
}
