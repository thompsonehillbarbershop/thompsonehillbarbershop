import { cn } from "@/lib/utils"
import { EAppointmentStatuses, EAppointmentStatusesMapper } from "@/models/appointment"
import { ClassNameValue } from "tailwind-merge"

interface IAppointmentStatusBadgeProps {
  status: EAppointmentStatuses
  className?: ClassNameValue
}

export default function AppointmentStatusBadge({ status, className }: IAppointmentStatusBadgeProps) {
  return (
    <p
      className={cn("text-sm py-0.5 px-2 rounded-r-full rounded-l-full", className)}
      style={{
        backgroundColor: EAppointmentStatusesMapper[status].bgColor,
        color: EAppointmentStatusesMapper[status].textColor,
      }}
    >{EAppointmentStatusesMapper[status].label}</p>
  )
}
