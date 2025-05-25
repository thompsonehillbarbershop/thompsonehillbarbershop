import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IPaginated } from "./use-paginated-query"
import { ICustomerView } from "@/models/customer"
import { queries } from "@/lib/query-client"
import { IActionResponse } from "@/models/action-response"
import { getCustomersAction, updateCustomerAction } from "@/actions/customers"
import { UpdateCustomerInput } from "@/actions/customers/dto/update-customer.input"


export interface UseCustomersParams {
  page?: number
  limit?: number
  name?: string
  phoneNumber?: string
  referralCode?: string
  sortBy?: string
  order?: 'asc' | 'desc'
}

export const useCustomers = (params: UseCustomersParams = {}) => {
  const queryClient = useQueryClient()

  const query = useQuery<IPaginated<ICustomerView>>({
    queryKey: [queries.admin.customers, params],
    queryFn: async () => {
      const response: IActionResponse<IPaginated<ICustomerView>> = await getCustomersAction(params)

      if (!response.data) {
        throw new Error(response.error || 'Erro ao buscar clientes')
      }

      return {
        ...response.data,
        data: response.data.data.map((customer) => ({
          ...customer,
          createdAt: new Date(customer.createdAt),
          birthDate: new Date(customer.birthDate),
        })),
      }
    },
    refetchOnWindowFocus: true,
  })

  const { mutateAsync: updateCustomer } = useMutation({
    mutationKey: ["updateCustomer"],
    mutationFn: async ({ id, data }: { id: string, data: UpdateCustomerInput }): Promise<IActionResponse<ICustomerView>> => {
      const response = await updateCustomerAction(id, data)

      if (response.data) {
        queryClient.setQueryData([queries.admin.customers, params], (current: IPaginated<ICustomerView> | undefined) => {
          if (!current) return current

          return {
            ...current,
            data: current.data.map((customer) =>
              customer.id === response.data?.id
                ? { ...customer, ...response.data }
                : customer
            ),
          }
        })
      }

      return response
    }
  })

  return {
    ...query,
    updateCustomer
  }
}
