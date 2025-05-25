import { startAttendingAppointmentAction } from "@/actions/appointments"
import { IActionResponse } from "@/models/action-response"
import { IAppointmentView } from "@/models/appointment"
import { useMutation } from "@tanstack/react-query"

export const useAttendant = () => {

  const { mutateAsync: startAttendance, isPending: isStartingAttendance } = useMutation({
    mutationKey: ["startAttendingAppointment"],
    mutationFn: async ({ id, attendantId }: {
      id: string,
      attendantId: string
    }): Promise<IActionResponse<IAppointmentView>> => {
      const response = await startAttendingAppointmentAction(id, attendantId)

      return response
    },
  })

  return {
    startAttendance,
    isStartingAttendance
  }
}