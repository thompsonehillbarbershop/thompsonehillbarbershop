import { createApiKeyAction, deleteApiKeyAction, getApiKeysAction } from "@/actions/auth"
import { CreateApiKeyInput } from "@/actions/auth/dto/create-api-key.input"
import { createPartnershipAction, getPartnershipsAction, updatePartnershipAction } from "@/actions/partnerships"
import { CreatePartnershipInput } from "@/actions/partnerships/dto/create-partnership.input"
import { UpdatePartnershipInput } from "@/actions/partnerships/dto/update-partnership.input"
import { createProductAction, getProductsAction, updateProductAction } from "@/actions/products"
import { CreateProductInput } from "@/actions/products/dto/create-product.input"
import { UpdateProductInput } from "@/actions/products/dto/update-product.input"
import { createServiceAction, getServicesAction, updateServiceAction } from "@/actions/services"
import { CreateServiceInput } from "@/actions/services/dto/create-service.input"
import { UpdateServiceInput } from "@/actions/services/dto/update-service.input"
import { createUserAction, getUsersAction, updateUserAction } from "@/actions/users"
import { CreateUserInput } from "@/actions/users/dtos/create-user.input"
import { UpdateUserInput } from "@/actions/users/dtos/update-user.input"
import { queries } from "@/lib/query-client"
import { IActionResponse } from "@/models/action-response"
import { IApiKeyView } from "@/models/api-key"
import { IPartnershipView } from "@/models/partnerships"
import { IProductView } from "@/models/product"
import { IServiceView } from "@/models/service"
import { IUserView } from "@/models/user"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useAdmin = () => {
  const queryClient = useQueryClient()

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: [queries.admin.users],
    queryFn: async (): Promise<IUserView[]> => {
      const response = await getUsersAction()

      if (response.data) {
        return response.data.map((user) => ({
          ...user,
          createdAt: new Date(user.createdAt)
        }))
      }

      return response.data || []
    },
  })

  const { mutateAsync: createUser } = useMutation({
    mutationKey: ["createUser"],
    mutationFn: async (data: CreateUserInput): Promise<IActionResponse<IUserView>> => {
      const response = await createUserAction(data)

      if (response.data) {
        queryClient.setQueryData([queries.admin.users], (current: IUserView[]) => {
          if (!current) return [response.data]
          return [...current, response.data]
        })

        return response
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queries.admin.users] })
    },
  })

  const { mutateAsync: updateUser } = useMutation({
    mutationKey: ["updateUser"],
    mutationFn: async ({ id, userName, data }: { id: string, userName: string, data: UpdateUserInput }): Promise<IActionResponse<IUserView>> => {
      const response = await updateUserAction(id, userName, data)

      if (!!response.data) {
        queryClient.setQueryData([queries.admin.users], (current: IUserView[]) => {
          return current?.map((user) => {
            if (user.id === response.data?.id) {
              return { ...user, ...response.data }
            }
            return user
          })
        })

        return response
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queries.admin.users] })
    },
  })

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: [queries.admin.services],
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

  const { mutateAsync: createService } = useMutation({
    mutationKey: ["createService"],
    mutationFn: async (data: CreateServiceInput): Promise<IActionResponse<IServiceView>> => {
      const response = await createServiceAction(data)

      if (response.data) {
        queryClient.setQueryData([queries.admin.services], (current: IServiceView[]) => {
          if (!current) return [response.data]
          return [...current, response.data]
        })

        return response
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queries.admin.services] })
    },
  })

  const { mutateAsync: updateService } = useMutation({
    mutationKey: ["updateService"],
    mutationFn: async ({ id, data }: { id: string, data: UpdateServiceInput }): Promise<IActionResponse<IServiceView>> => {
      const response = await updateServiceAction(id, data)

      if (!!response.data) {
        queryClient.setQueryData([queries.admin.services], (current: IServiceView[]) => {
          return current?.map((service) => {
            if (service.id === response.data?.id) {
              return { ...service, ...response.data }
            }
            return service
          })
        })

        return response
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queries.admin.services] })
    },
  })

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: [queries.admin.products],
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

  const { mutateAsync: createProduct } = useMutation({
    mutationKey: ["createProduct"],
    mutationFn: async (data: CreateProductInput): Promise<IActionResponse<IProductView>> => {
      const response = await createProductAction(data)

      if (response.data) {
        queryClient.setQueryData([queries.admin.products], (current: IProductView[]) => {
          if (!current) return [response.data]
          return [...current, response.data]
        })

        return response
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queries.admin.products] })
    },
  })

  const { mutateAsync: updateProduct } = useMutation({
    mutationKey: ["updateProduct"],
    mutationFn: async ({ id, data }: { id: string, data: UpdateProductInput }): Promise<IActionResponse<IProductView>> => {
      const response = await updateProductAction(id, data)

      if (!!response.data) {
        queryClient.setQueryData([queries.admin.products], (current: IProductView[]) => {
          return current?.map((product) => {
            if (product.id === response.data?.id) {
              return { ...product, ...response.data }
            }
            return product
          })
        })

        return response
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queries.admin.products] })
    },
  })

  const { data: partnerships, isLoading: isLoadingPartnerships } = useQuery({
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

  const { mutateAsync: createPartnership } = useMutation({
    mutationKey: ["createPartnership"],
    mutationFn: async (data: CreatePartnershipInput): Promise<IActionResponse<IPartnershipView>> => {
      const response = await createPartnershipAction(data)

      if (response.data) {
        queryClient.setQueryData([queries.admin.partnerships], (current: IPartnershipView[]) => {
          if (!current) return [response.data]
          return [...current, response.data]
        })

        return response
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queries.admin.partnerships] })
    },
  })

  const { mutateAsync: updatePartnership } = useMutation({
    mutationKey: ["updatePartnership"],
    mutationFn: async ({ id, data }: { id: string, data: UpdatePartnershipInput }): Promise<IActionResponse<IPartnershipView>> => {
      const response = await updatePartnershipAction(id, data)

      if (!!response.data) {
        queryClient.setQueryData([queries.admin.partnerships], (current: IPartnershipView[]) => {
          return current?.map((partnership) => {
            if (partnership.id === response.data?.id) {
              return { ...partnership, ...response.data }
            }
            return partnership
          })
        })

        return response
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queries.admin.partnerships] })
    },
  })

  const { data: apiKeys, isLoading: isLoadingApiKeys } = useQuery({
    queryKey: [queries.admin.apiKeys],
    queryFn: async (): Promise<IApiKeyView[]> => {
      const response = await getApiKeysAction()

      if (response.data) {
        return response.data.map((key) => ({
          ...key,
          createdAt: new Date(key.createdAt)
        }))
      }

      return response.data || []
    },
  })

  const { mutateAsync: createApiKey } = useMutation({
    mutationKey: ["createApiKey"],
    mutationFn: async (data: CreateApiKeyInput): Promise<IActionResponse<IApiKeyView>> => {
      const response = await createApiKeyAction(data)

      if (response.data) {
        queryClient.setQueryData([queries.admin.apiKeys], (current: IApiKeyView[]) => {
          if (!current) return [response.data]
          return [...current, response.data]
        })

        return response
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queries.admin.apiKeys] })
    },
  })

  const { mutateAsync: deleteApiKey } = useMutation({
    mutationKey: ["deleteApiKey"],
    mutationFn: async (id: string): Promise<void> => {
      try {
        const response = await deleteApiKeyAction(id)

        if (response.error) {
          throw new Error(response.error)
        }
        queryClient.setQueryData([queries.admin.apiKeys], (current: IApiKeyView[]) => {
          if (!current) return []
          return current.filter((key) => key.id !== id)
        })

      } catch (error) {
        console.error(error)
        return
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queries.admin.apiKeys] })
    }
  })

  return {
    users,
    isLoadingUsers,
    createUser,
    updateUser,
    services,
    isLoadingServices,
    createService,
    updateService,
    products,
    isLoadingProducts,
    createProduct,
    updateProduct,
    partnerships,
    isLoadingPartnerships,
    createPartnership,
    updatePartnership,
    apiKeys,
    isLoadingApiKeys,
    createApiKey,
    deleteApiKey
  }
}