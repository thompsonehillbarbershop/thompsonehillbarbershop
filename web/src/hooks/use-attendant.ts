import { updateAppointmentAction } from "@/actions/appointments"
import { updateCustomerAction } from "@/actions/customers"
import { UpdateCustomerInput } from "@/actions/customers/dto/update-customer.input"
import axiosWebClient from "@/lib/axios-web"
import { queries } from "@/lib/query-client"
import { IActionResponse } from "@/models/action-response"
import { EAppointmentStatuses, IAppointmentView } from "@/models/appointment"
import { IAppointmentSummaryView } from "@/models/appointments-summary"
import { ICustomerView } from "@/models/customer"
import { IPartnershipView } from "@/models/partnerships"
import { IProductView } from "@/models/product"
import { IServiceView } from "@/models/service"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useLocalStorage } from "./use-local-storage"

export const useAttendant = () => {
  const APPOINTMENTS_END_POINT = "/appointments"
  const { storedValue: token } = useLocalStorage("secret", "")

  const { mutateAsync: startAttendance, isPending: isStartingAttendance } = useMutation({
    mutationKey: ["startAttendingAppointment"],
    mutationFn: async ({ id, attendantId }: {
      id: string,
      attendantId: string
    }): Promise<IActionResponse<IAppointmentView>> => {
      const { data } = await axiosWebClient.put<IAppointmentView>(`${APPOINTMENTS_END_POINT}/${id}`, {
        attendantId: attendantId,
        status: EAppointmentStatuses.ON_SERVICE
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return { data }
    },
  })

  const { mutateAsync: findAttendance, isPending: isFindingAttendance } = useMutation({
    mutationKey: ["findAttendance"],
    mutationFn: async ({ id }: {
      id: string
    }): Promise<IActionResponse<IAppointmentView>> => {
      const { data } = await axiosWebClient.get<IAppointmentView>(`${APPOINTMENTS_END_POINT}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return { data }
    },
  })

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: [queries.attendant.services],
    queryFn: async (): Promise<IServiceView[]> => {
      const { data } = await axiosWebClient.get<IServiceView[]>(`/services`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data) {
        return data.map((service) => ({
          ...service,
          createdAt: new Date(service.createdAt)
        }))
      }

      return data || []
    },
  })

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: [queries.attendant.products],
    queryFn: async (): Promise<IProductView[]> => {
      const { data } = await axiosWebClient.get<IProductView[]>(`/products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data) {
        return data.map((product) => ({
          ...product,
          createdAt: new Date(product.createdAt)
        }))
      }

      return data || []
    },
  })

  const { data: partnerships } = useQuery({
    queryKey: [queries.admin.partnerships],
    queryFn: async (): Promise<IPartnershipView[]> => {
      const { data } = await axiosWebClient.get<IPartnershipView[]>(`/partnerships`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (data) {
        return data.map((partnership) => ({
          ...partnership,
          createdAt: new Date(partnership.createdAt)
        }))
      }

      return data || []
    },
  })

  const { mutateAsync: updateCustomerPhoto } = useMutation({
    mutationKey: ["updateCustomerPhoto"],
    mutationFn: async ({ id, profileImage, imageContentType }: { id: string, profileImage: string, imageContentType: string }): Promise<IActionResponse<ICustomerView>> => {
      const response = await updateCustomerAction(id, {
        profileImage,
        imageContentType
      } as UpdateCustomerInput)

      return response
    }
  })

  const { mutateAsync: getSummary, isPending: isGettingDaySummary } = useMutation({
    mutationKey: ["getDaySummary"],
    mutationFn: async ({ id, from, to }: {
      id: string,
      from: string,
      to: string
    }): Promise<IActionResponse<IAppointmentSummaryView>> => {

      console.log("Fetching summary for user:", id, "from:", from, "to:", to)

      const { data } = await axiosWebClient.get<IAppointmentSummaryView>(`${APPOINTMENTS_END_POINT}/summary/${id}?from=${from}&to=${to}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      return { data }
    },
  })

  const { mutateAsync: cancelAttendance } = useMutation({
    mutationKey: ["cancelAppointment"],
    mutationFn: async ({ id }: {
      id: string
    }): Promise<IActionResponse<IAppointmentView>> => {
      const response = await updateAppointmentAction(id, {
        status: EAppointmentStatuses.CANCELLED,
      })

      return response
    },
  })

  const { mutateAsync: noShowAttendance } = useMutation({
    mutationKey: ["noShowAppointment"],
    mutationFn: async ({ id }: {
      id: string
    }): Promise<IActionResponse<IAppointmentView>> => {
      const response = await updateAppointmentAction(id, {
        status: EAppointmentStatuses.NO_SHOW,
      })

      return response
    },
  })

  const { mutateAsync: assumeAttendance } = useMutation({
    mutationKey: ["assumeAttendance"],
    mutationFn: async ({ id, attendantId }: {
      id: string,
      attendantId: string
    }): Promise<IActionResponse<IAppointmentView>> => {
      const response = await updateAppointmentAction(id, {
        attendantId,
      })

      return response
    },
  })


  return {
    startAttendance,
    isStartingAttendance,
    findAttendance,
    isFindingAttendance,
    services,
    isLoadingServices,
    products,
    isLoadingProducts,
    partnerships,
    updateCustomerPhoto,
    getSummary,
    isGettingDaySummary,
    cancelAttendance,
    noShowAttendance,
    assumeAttendance,
  }
}