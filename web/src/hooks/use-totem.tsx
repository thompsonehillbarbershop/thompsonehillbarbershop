import { createAppointmentAction } from "@/actions/appointments"
import { CreateAppointmentInput } from "@/actions/appointments/dto/create-appointment.input"
import { createCustomerAction, getCustomerByPhoneAction } from "@/actions/customers"
import { CreateCustomerInput } from "@/actions/customers/dto/create-customer.input"
import { getServicesAction } from "@/actions/services"
import { getAttendantsAction } from "@/actions/users"
import { queries } from "@/lib/query-client"
import { IActionResponse } from "@/models/action-response"
import { IAppointmentView } from "@/models/appointment"
import { ICustomerView } from "@/models/customer"
import { IServiceView } from "@/models/service"
import { IUserView } from "@/models/user"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useTotem = () => {
  const { data: attendants, isLoading: isLoadingAttendants } = useQuery({
    queryKey: [queries.totem.attendants],
    queryFn: async (): Promise<IActionResponse<IUserView[]>> => {

      const response = await getAttendantsAction()

      if (response.data) {
        return {
          data: response.data.map((user) => ({
            ...user,
            createdAt: new Date(user.createdAt)
          }))
        }
      }

      return response
    },
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 60, // 5 minutes
  })

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: [queries.totem.services],
    queryFn: async (): Promise<IActionResponse<IServiceView[]>> => {

      const response = await getServicesAction()

      if (response.data) {
        return {
          data: response.data.map((service) => ({
            ...service,
            createdAt: new Date(service.createdAt)
          }))
        }
      }

      return response
    },
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 60, // 60 minutes
  })

  const { mutateAsync: getCustomer } = useMutation({
    mutationKey: ["getCustomerByPhone"],
    mutationFn: async (phoneNumber: string): Promise<IActionResponse<ICustomerView>> => {
      const response = await getCustomerByPhoneAction(phoneNumber)

      return response
    }
  })

  const { mutateAsync: registerCustomer } = useMutation({
    mutationKey: ["registerCustomer"],
    mutationFn: async (data: CreateCustomerInput): Promise<IActionResponse<ICustomerView>> => {
      const response = await createCustomerAction(data)

      return response
    }
  })

  const { mutateAsync: createAppointment, isPending: isCreatingAppointment } = useMutation({
    mutationKey: ["createAppointment"],
    mutationFn: async (data: CreateAppointmentInput): Promise<IActionResponse<IAppointmentView>> => {
      const response = await createAppointmentAction(data)

      return response
    }
  })

  return {
    getCustomer,
    registerCustomer,
    services,
    isLoadingServices,
    attendants,
    isLoadingAttendants,
    createAppointment,
    isCreatingAppointment
  }
}