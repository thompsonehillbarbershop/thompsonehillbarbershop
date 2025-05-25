"use client"

import AttendanceAppointmentCard from "@/components/attendant/appointment-card"
import { useAttendant } from "@/hooks/use-attendant"
import { useQueue } from "@/hooks/useQueue"
import { IFirebaseAppointment } from "@/models/firebase-appointment"
import { useMemo } from "react"

export default function AttendantQueuePageContents({ userId, userName }: { userId: string, userName: string }) {
  const queue = useQueue()
  const { startAttendance, isStartingAttendance } = useAttendant()

  const userQueue = useMemo(() => {
    const officialQueue = queue[userName] || []
    if (officialQueue.length > 0) return officialQueue

    const generalQueue = queue["fila_geral"] || []
    return generalQueue
  }, [queue, userName])

  async function onAttendanceStart(appointment: IFirebaseAppointment) {
    const response = await startAttendance({
      id: appointment.id,
      attendantId: userId,
    })

    if (response.error) {
      console.error("Error starting attendance:", response.error)
      return
    }
  }

  return (
    <div className="w-full">
      {userQueue?.map((appointment, index) => (
        <AttendanceAppointmentCard
          key={appointment.id}
          index={index}
          appointment={appointment}
          onAttendanceStart={onAttendanceStart}
          isStartingAttendance={isStartingAttendance}
        />
      ))}
    </div>
  )
}
