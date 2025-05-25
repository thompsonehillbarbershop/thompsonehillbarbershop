"use client"

import { IFirebaseAppointment } from "@/models/firebase-appointment"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { H2 } from "../ui/typography"
import { format } from "date-fns"
import { Button } from "../ui/button"
import { CircleCheckBigIcon, PlayIcon, SettingsIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { EAppointmentStatuses } from "@/models/appointment"

interface IAppointmentCardProps {
  index: number
  appointment: IFirebaseAppointment
  onAttendanceStart: (appointment: IFirebaseAppointment) => void
  isStartingAttendance: boolean
}

export default function AttendanceAppointmentCard({ index, appointment, onAttendanceStart, isStartingAttendance }: IAppointmentCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="w-full flex items-center justify-between">
          <p className={cn("text-primary font-semibold", index === 0 ? "text-primary" : "text-transparent")}>Próximo Cliente</p>
          <p className={cn("text-sm font-semibold", appointment.attendant ? "text-transparent" : "text-primary")}>Fila Geral</p>
        </div>
        <H2 className={cn("text-center", index === 0 && "text-2xl")}>{appointment.customer.name}</H2>
      </CardHeader>
      <CardContent>
        {appointment.services.map((service) => (
          <p key={service.id} className="text-sm text-muted-foreground">
            Serviço <strong className="text-foreground">{service.name}</strong>
          </p>
        ))}
        {index === 0 && (<p className="text-sm text-muted-foreground"><strong className="text-foreground">Primeiro Atendimento</strong></p>)}
        <p className="text-sm text-muted-foreground">Entrada as <strong className="text-foreground">{format(new Date(appointment.createdAt), "hh:mm")}</strong></p>
        {appointment.onServiceAt && (
          <p className="text-sm text-muted-foreground">Atendimento iniciado as <strong className="text-foreground">{format(new Date(appointment.onServiceAt), "hh:mm")}</strong></p>
        )}
      </CardContent>
      {index === 0 && (
        <CardFooter className="w-full flex justify-start items-end gap-2">
          {appointment.status === EAppointmentStatuses.WAITING && (
            <Button
              size="lg"
              className="flex-1"
              isLoading={isStartingAttendance}
              onClick={() => onAttendanceStart(appointment)}
            >
              <PlayIcon className="size-6" />
              Iniciar Atendimento
            </Button>
          )}
          {appointment.status === EAppointmentStatuses.ON_SERVICE && (
            <Button
              size="lg"
              variant="destructive"
              className="flex-1"
              isLoading={isStartingAttendance}
              onClick={() => onAttendanceStart(appointment)}
            >
              <CircleCheckBigIcon className="size-6" />
              Encerrar Atendimento
            </Button>
          )}
          <Button variant="outline" size="icon"><SettingsIcon /></Button>
        </CardFooter>
      )}
    </Card>
  )
}
