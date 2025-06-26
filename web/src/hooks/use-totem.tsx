"use client"

import { CreateAppointmentInput } from "@/actions/appointments/dto/create-appointment.input"
import { createCustomerAction } from "@/actions/customers"
import { CreateCustomerInput } from "@/actions/customers/dto/create-customer.input"
import axiosWebClient from "@/lib/axios-web"
import { queries } from "@/lib/query-client"
import { IActionResponse } from "@/models/action-response"
import { IAppointmentView } from "@/models/appointment"
import { ICustomerView } from "@/models/customer"
import { EPartnershipType, IPartnershipView } from "@/models/partnerships"
import { IServiceView } from "@/models/service"
import { IUserView } from "@/models/user"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useLocalStorage } from "./use-local-storage"

export const useTotem = () => {
  const { storedValue: token } = useLocalStorage("secret", "")

  const { data: attendants, isLoading: isLoadingAttendants } = useQuery({
    queryKey: [queries.totem.attendants],
    queryFn: async (): Promise<IActionResponse<IUserView[]>> => {

      const { data: response } = await axiosWebClient.get<IUserView[]>(`/users/attendants`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response) {
        return {
          data: response.map((user) => ({
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

      const { data: response } = await axiosWebClient.get<IServiceView[]>(`/services`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response) {
        return {
          data: response.map((service) => ({
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
    mutationFn: async (phoneNumber: string): Promise<ICustomerView | null> => {
      try {
        const { data: response } = await axiosWebClient.get<ICustomerView>(`/customers/phoneNumber/${phoneNumber}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        return response
      } catch (error) {
        const err = error as Error
        if (err.message.includes("Customer not found")) {
          return null
        }
        throw err
      }
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
    mutationFn: async (data: CreateAppointmentInput): Promise<IAppointmentView> => {
      // const response = await createAppointmentAction(data)
      const { data: response } = await axiosWebClient.post<IAppointmentView>("/appointments", data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return response
    }
  })

  const { data: partnerships, isLoading: isLoadingPartnerships } = useQuery({
    queryKey: [queries.admin.partnerships],
    queryFn: async (): Promise<IPartnershipView[]> => {
      const { data: response } = await axiosWebClient.get<IPartnershipView[]>("/partnerships",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response) {
        return response.filter(partnership => partnership.type === EPartnershipType.COMMON).map((partnership) => ({
          ...partnership,
          createdAt: new Date(partnership.createdAt)
        }))
      }

      return []
    },
  })

  return {
    getCustomer,
    registerCustomer,
    services,
    isLoadingServices,
    attendants,
    isLoadingAttendants,
    createAppointment,
    isCreatingAppointment,
    partnerships,
    isLoadingPartnerships,
  }
}