"use client"

import AttendanceAppointmentCard from "@/components/attendant/appointment-card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAttendant } from "@/hooks/use-attendant"
import { useQueue } from "@/hooks/useQueue"
import { EPages } from "@/lib/pages.enum"
import { EAppointmentStatuses } from "@/models/appointment"
import { IFirebaseAppointment } from "@/models/firebase-appointment"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BanIcon, UserPlusIcon } from "lucide-react"
import React from "react"
import { IUserView } from "@/models/user"
import { useLocalStorage } from "@/hooks/use-local-storage"
import axiosWebClient from "@/lib/axios-web"

export default function AttendantQueuePageContents() {
  const [userId, setUserId] = React.useState<string>("")
  const { storedValue: token } = useLocalStorage("secret", "")

  useEffect(() => {
    axiosWebClient.get<IUserView>(`/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((response) => {
      if (response.data) {
        setUserId(response.data.id)
      }
    })
  }, [token])

  const [showAll, setShowAll] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<IFirebaseAppointment | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const queue = useQueue()
  const { startAttendance, isStartingAttendance, cancelAttendance, assumeAttendance } = useAttendant()
  const router = useRouter()

  const userQueue = useMemo(() => {
    // If showAll is true, return all appointments
    if (showAll) {
      const allAppointments = Object.values(queue)
        .flat()
        .filter(appointment =>
          appointment.status === EAppointmentStatuses.WAITING ||
          (appointment.status === EAppointmentStatuses.ON_SERVICE && appointment.attendant?.id === userId)
        )

      // Remove duplicates by appointment ID
      const uniqueAppointmentsMap = new Map()
      allAppointments.forEach(appointment => {
        uniqueAppointmentsMap.set(appointment.id, appointment)
      })
      const uniqueAppointments = Array.from(uniqueAppointmentsMap.values())

      // Order appointments by creation date and prioritize ON_SERVICE status
      return uniqueAppointments
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .sort((a, b) => a.status === EAppointmentStatuses.ON_SERVICE ? -1 : 1)
    }

    // Check if the user has an official queue
    const officialQueue = queue[userId] || []
    if (officialQueue.filter(appointment => appointment.status === EAppointmentStatuses.WAITING || appointment.status === EAppointmentStatuses.ON_SERVICE).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return officialQueue.filter(appointment => appointment.status === EAppointmentStatuses.WAITING || appointment.status === EAppointmentStatuses.ON_SERVICE).sort((a, b) => a.status === EAppointmentStatuses.ON_SERVICE ? -1 : 1)
    }

    // Check if general queue has waiting appointments
    const generalQueue = queue["fila_geral"] || []
    if (generalQueue.filter(appointment => appointment.status === EAppointmentStatuses.WAITING).length > 0) {
      return generalQueue.filter(appointment => appointment.status === EAppointmentStatuses.WAITING)
    }

    // Check if there are other users' queues with waiting appointments
    // const otherUsersQueue = Object.values(queue).flat().filter(appointment => appointment.status === EAppointmentStatuses.WAITING)
    // if (otherUsersQueue.length > 0) {
    //   // Order by creation date
    //   otherUsersQueue.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    //   return otherUsersQueue
    // }

    // If no appointments found, return an empty array
    return []
  }, [queue, userId, showAll])

  async function onAttendanceStart(appointment: IFirebaseAppointment) {
    const response = await startAttendance({
      id: appointment.id,
      attendantId: userId,
    })

    if (response.error) {
      console.error("Erro ao iniciar", response.error)
      return
    }
  }

  async function onAttendanceEnd(appointment: IFirebaseAppointment) {
    router.push(`${EPages.ATTENDANCE_CHECKOUT}?appointmentId=${appointment.id}&attendantId=${userId}`)
  }

  async function onAttendanceCancel(appointment?: IFirebaseAppointment | null) {
    if (!appointment) {
      console.error("Nenhum atendimento selecionado para cancelar")
      return
    }

    const response = await cancelAttendance({
      id: appointment.id,
    })
    if (response.error) {
      console.error("Erro ao cancelar", response.error)
      return
    }
  }

  // async function onAttendanceNoShow(appointment?: IFirebaseAppointment | null) {
  //   if (!appointment) {
  //     console.error("Nenhum atendimento selecionado para marcar como não compareceu")
  //     return
  //   }

  //   const response = await noShowAttendance({
  //     id: appointment.id,
  //   })
  //   if (response.error) {
  //     console.error("Erro ao marcar como não compareceu", response.error)
  //     return
  //   }
  // }

  async function onAttendanceAssume(appointment?: IFirebaseAppointment | null) {
    if (!appointment) {
      console.error("Nenhum atendimento selecionado para assumir")
      return
    }

    const response = await assumeAttendance({
      id: appointment.id,
      attendantId: userId,
    })
    if (response.error) {
      console.error("Erro ao assumir atendimento", response.error)
      return
    }
  }

  return (
    <div className="w-full space-y-2">
      <div className="w-full flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Fila de Atendimento</h1>
        <div className="flex justify-end items-center gap-2">
          <Checkbox
            id="showAll"
            className="size-7"
            checked={showAll}
            onCheckedChange={() => setShowAll(!showAll)}
          />
          <Label
            htmlFor="showAll"
            className="sm:text-lg"
          >Todos os atendimentos</Label>

        </div>
      </div>
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
          onSettingsClick={() => {
            setSelectedAppointment(appointment)
            setOpenDialog(true)
          }}
          isStartingAttendance={isStartingAttendance}
        />
      ))}

      <Dialog
        open={openDialog}
        onOpenChange={setOpenDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ações Rápidas</DialogTitle>
            <DialogDescription className="space-y-2 pt-4">
              <Button
                className="w-full"
                size="lg"
                variant="secondary"
                onClick={() => {
                  setOpenDialog(false)
                  onAttendanceAssume(selectedAppointment)
                }}
              >
                <UserPlusIcon className="size-6" /> Atribuir a Mim
              </Button>
              {/* <Button
                className="w-full"
                size="lg"
                variant="secondary"
                onClick={() => {
                  setOpenDialog(false)
                  onAttendanceNoShow(selectedAppointment)
                }}
              >
                <UserXIcon className="size-6" /> Cliente Não Compareceu
              </Button> */}
              <Button
                className="w-full"
                size="lg"
                variant="secondary"
                onClick={() => {
                  setOpenDialog(false)
                  onAttendanceCancel(selectedAppointment)
                }}
              >
                <BanIcon className="size-6" /> Cancelar Atendimento
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
