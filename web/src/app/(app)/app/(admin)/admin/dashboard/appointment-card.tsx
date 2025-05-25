"use client"

import { cn } from "@/lib/utils"
import { EAppointmentStatuses, EAppointmentStatusesMapper } from "@/models/appointment"
import { IFirebaseAppointment } from "@/models/firebase-appointment"
import { format } from "date-fns"

interface AppointmentCardProps {
  appointment: IFirebaseAppointment
}

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  return (
    <div
      key={appointment.id}
      className={cn("bg-input/10 flex flex-col gap-1 border-2 border-input rounded-xl p-2",
        (appointment.status === EAppointmentStatuses.CANCELLED || appointment.status === EAppointmentStatuses.NO_SHOW || appointment.status === EAppointmentStatuses.FINISHED) && "opacity-25",
        appointment.status === EAppointmentStatuses.WAITING && "opacity-90",
        !appointment.attendant && "border-dashed",
      )}
    >
      <p className={cn("text-sm font-semibold text-center bg-secondary text-secondary-foreground rounded", appointment.attendant && "hidden")}>Fila Geral</p>
      <div className="flex items-center justify-between">
        <p>{format(new Date(appointment.createdAt || ""), "HH:mm")}</p>
        <p
          className="text-sm py-0.5 px-2 rounded-r-full rounded-l-full"
          style={{
            backgroundColor: EAppointmentStatusesMapper[appointment.status].bgColor,
            color: EAppointmentStatusesMapper[appointment.status].textColor,
          }}
        >{EAppointmentStatusesMapper[appointment.status].label}</p>
      </div>
      <h3 className="font-bold text-lg">{appointment.customer?.name}</h3>
      {appointment.services.map((service) => (
        <h4
          key={service.id}
          className="text-sm text-muted-foreground line-clamp-1">- {service.name}</h4>
      ))}
    </div>
  )
}
