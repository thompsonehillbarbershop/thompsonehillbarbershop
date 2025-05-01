import { createUserAction, getUsersAction } from "@/actions/users"
import { CreateUserInput } from "@/actions/users/dtos/create-user.input"
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
  })


  return {
    users,
    isLoadingUsers,
    createUser
  }
}