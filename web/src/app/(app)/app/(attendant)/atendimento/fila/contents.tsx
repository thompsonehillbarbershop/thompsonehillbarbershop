"use client"

import AttendanceAppointmentCard from "@/components/attendant/appointment-card"
import { useAttendant } from "@/hooks/use-attendant"
import { useQueue } from "@/hooks/useQueue"
import { EPages } from "@/lib/pages.enum"
import { EAppointmentStatuses } from "@/models/appointment"
import { IFirebaseAppointment } from "@/models/firebase-appointment"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

export default function AttendantQueuePageContents({ userId }: { userId: string }) {
  const queue = useQueue()
  const { startAttendance, isStartingAttendance } = useAttendant()
  const router = useRouter()

  const userQueue = useMemo(() => {

    // Check if the user has an official queue
    const officialQueue = queue[userId] || []
    if (officialQueue.filter(appointment => appointment.status === EAppointmentStatuses.WAITING || appointment.status === EAppointmentStatuses.ON_SERVICE).length > 0) {
      return officialQueue.filter(appointment => appointment.status === EAppointmentStatuses.WAITING || appointment.status === EAppointmentStatuses.ON_SERVICE)
    }

    // Check if general queue has waiting appointments
    const generalQueue = queue["fila_geral"] || []
    if (generalQueue.filter(appointment => appointment.status === EAppointmentStatuses.WAITING).length > 0) {
      return generalQueue.filter(appointment => appointment.status === EAppointmentStatuses.WAITING)
    }

    // Check if there are other users' queues with waiting appointments
    const otherUsersQueue = Object.values(queue).flat().filter(appointment => appointment.status === EAppointmentStatuses.WAITING)
    if (otherUsersQueue.length > 0) {
      // Order by creation date
      otherUsersQueue.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      return otherUsersQueue
    }

    // If no appointments found, return an empty array
    return []
  }, [queue, userId])

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

  async function onAttendanceEnd(appointment: IFirebaseAppointment) {
    router.push(`${EPages.ATTENDANCE_CHECKOUT}?appointmentId=${appointment.id}&attendantId=${userId}`)
  }

  return (
    <div className="w-full space-y-2">
      {userQueue.length === 0 && (
        <div className="text-center text-2xl sm:text-3xl font-bold">
          Não há atendimentos na fila
        </div>
      )}
      {userQueue?.map((appointment, index) => (
        <AttendanceAppointmentCard
          key={appointment.id}
          index={index}
          appointment={appointment}
          userId={userId}
          onAttendanceStart={onAttendanceStart}
          onAttendanceEnd={onAttendanceEnd}
          isStartingAttendance={isStartingAttendance}
        />
      ))}
    </div>
  )
}
