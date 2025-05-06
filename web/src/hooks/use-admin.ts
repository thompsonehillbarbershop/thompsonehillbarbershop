import { createUserAction, getUsersAction, updateUserAction } from "@/actions/users"
import { CreateUserInput } from "@/actions/users/dtos/create-user.input"
import { UpdateUserInput } from "@/actions/users/dtos/update-user.input"
import { queries } from "@/lib/query-client"
import { IUserView } from "@/models/user"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useAdmin = () => {
  const queryClient = useQueryClient()

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: [queries.admin.users],
    queryFn: async () => {
      const users = await getUsersAction()

      return users.map((user) => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }))
    },
  })

  const { mutateAsync: createUser } = useMutation({
    mutationKey: ["createUser"],
    mutationFn: async (data: CreateUserInput) => {
      const newUser = await createUserAction(data)

      queryClient.setQueryData([queries.admin.users], (current: IUserView[]) => {
        if (!current) return [newUser]
        return [...current, newUser]
      })

      return newUser
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })

  const { mutateAsync: updateUser } = useMutation({
    mutationKey: ["updateUser"],
    mutationFn: async ({ id, data }: { id: string, data: UpdateUserInput }) => {
      const updatedUser = await updateUserAction(id, data)

      queryClient.setQueryData([queries.admin.users], (current: IUserView[]) => {
        return current.map((user) => {
          if (user.id === updatedUser.id) {
            return { ...user, ...updatedUser }
          }
          return user
        })
      })

      return updatedUser
    }
  })


  return {
    users,
    isLoadingUsers,
    createUser,
    updateUser
  }
}