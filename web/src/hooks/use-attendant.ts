import { getAppointmentByIdAction, getUserAppointmentsSummaryAction, startAttendingAppointmentAction } from "@/actions/appointments"
import { updateCustomerAction } from "@/actions/customers"
import { UpdateCustomerInput } from "@/actions/customers/dto/update-customer.input"
import { getPartnershipsAction } from "@/actions/partnerships"
import { getProductsAction } from "@/actions/products"
import { getServicesAction } from "@/actions/services"
import { queries } from "@/lib/query-client"
import { IActionResponse } from "@/models/action-response"
import { IAppointmentView } from "@/models/appointment"
import { IAppointmentSummaryView } from "@/models/appointments-summary"
import { ICustomerView } from "@/models/customer"
import { IPartnershipView } from "@/models/partnerships"
import { IProductView } from "@/models/product"
import { IServiceView } from "@/models/service"
import { useMutation, useQuery } from "@tanstack/react-query"

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

  const { mutateAsync: findAttendance, isPending: isFindingAttendance } = useMutation({
    mutationKey: ["findAttendance"],
    mutationFn: async ({ id }: {
      id: string
    }): Promise<IActionResponse<IAppointmentView>> => {
      const response = await getAppointmentByIdAction(id)

      return response
    },
  })

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: [queries.attendant.services],
    queryFn: async (): Promise<IServiceView[]> => {
      const response = await getServicesAction()

      if (response.data) {
        return response.data.map((service) => ({
          ...service,
          createdAt: new Date(service.createdAt)
        }))
      }

      return response.data || []
    },
  })

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: [queries.attendant.products],
    queryFn: async (): Promise<IProductView[]> => {
      const response = await getProductsAction()

      if (response.data) {
        return response.data.map((product) => ({
          ...product,
          createdAt: new Date(product.createdAt)
        }))
      }

      return response.data || []
    },
  })

  const { data: partnerships } = useQuery({
    queryKey: [queries.admin.partnerships],
    queryFn: async (): Promise<IPartnershipView[]> => {
      const response = await getPartnershipsAction()

      if (response.data) {
        return response.data.map((partnership) => ({
          ...partnership,
          createdAt: new Date(partnership.createdAt)
        }))
      }

      return response.data || []
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
    mutationFn: async ({ id }: {
      id: string
    }): Promise<IActionResponse<IAppointmentSummaryView>> => {
      const response = await getUserAppointmentsSummaryAction(id)

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
    isGettingDaySummary
  }
}