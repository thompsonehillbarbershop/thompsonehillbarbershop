import { createUserAction, getUsersAction, updateUserAction } from "@/actions/users"
import { CreateUserInput } from "@/actions/users/dtos/create-user.input"
import { UpdateUserInput } from "@/actions/users/dtos/update-user.input"
import { queries } from "@/lib/query-client"
import { IActionResponse } from "@/models/action-response"
import { IUserView } from "@/models/user"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useUsers = () => {
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

  return {
    users,
    isLoadingUsers,
    createUser,
    updateUser,
  }
}