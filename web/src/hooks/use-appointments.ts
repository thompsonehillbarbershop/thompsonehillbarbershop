import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IPaginated } from "./use-paginated-query"
import { queries } from "@/lib/query-client"
import { IActionResponse } from "@/models/action-response"
import { IAppointmentView } from "@/models/appointment"
import { getAppointmentsAction, updateAppointmentAction } from "@/actions/appointments"
import { UpdateAppointmentInput } from "@/actions/appointments/dto/update-appointment.input"


export interface UseAppointmentsParams {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

export const useAppointments = (params: UseAppointmentsParams = {}) => {
  const queryClient = useQueryClient()

  const query = useQuery<IPaginated<IAppointmentView>>({
    queryKey: [queries.admin.appointments, params],
    queryFn: async () => {
      const response: IActionResponse<IPaginated<IAppointmentView>> = await getAppointmentsAction(params)

      if (!response.data) {
        throw new Error(response.error || 'Erro ao buscar atendimentos')
      }

      return {
        ...response.data,
        data: response.data.data.map((appointment) => ({
          ...appointment,
        })),
      }
    },
    refetchOnWindowFocus: true,
  })

  const { mutateAsync: updateAppointment } = useMutation({
    mutationKey: ["updateAppointment"],
    mutationFn: async ({ id, data }: { id: string, data: UpdateAppointmentInput }): Promise<IActionResponse<IAppointmentView>> => {
      const response = await updateAppointmentAction(id, data)

      if (response.data) {
        queryClient.setQueryData([queries.admin.appointments, params], (current: IPaginated<IAppointmentView> | undefined) => {
          if (!current) return current

          const returnData = {
            ...current,
            data: current.data.map((appointment) =>
              appointment.id === response.data?.id
                ? { ...appointment, ...response.data }
                : appointment
            ),
          }

          console.log("returnData", returnData)

          return returnData
        })
      }

      return response
    }
  })

  return {
    ...query,
    updateAppointment,
  }
}
