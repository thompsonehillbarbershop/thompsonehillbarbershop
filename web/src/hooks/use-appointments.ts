import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IPaginated } from "./use-paginated-query"
import { queries } from "@/lib/query-client"
import { IActionResponse } from "@/models/action-response"
import { IAppointmentView } from "@/models/appointment"
import { getAppointmentsAction } from "@/actions/appointments"
import { UpdateAppointmentInput } from "@/actions/appointments/dto/update-appointment.input"
import axiosWebClient from "@/lib/axios-web"
import { useLocalStorage } from "./use-local-storage"


export interface UseAppointmentsParams {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

export const useAppointments = (params: UseAppointmentsParams = {}) => {
  const queryClient = useQueryClient()
  const { storedValue: token } = useLocalStorage("secret", "")

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
      // const response = await updateAppointmentAction(id, data)

      const { data: response } = await axiosWebClient.put<IAppointmentView>(`/appointments/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response) {
        queryClient.setQueryData([queries.admin.appointments, params], (current: IPaginated<IAppointmentView> | undefined) => {
          if (!current) return current

          const returnData = {
            ...current,
            data: current.data.map((appointment) =>
              appointment.id === response.id
                ? { ...appointment, ...response }
                : appointment
            ),
          }

          return returnData
        })
      }

      return { data: response }
    }
  })

  return {
    ...query,
    updateAppointment,
  }
}
