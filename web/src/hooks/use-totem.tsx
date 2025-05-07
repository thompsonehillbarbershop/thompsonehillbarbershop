import { getAttendantsAction } from "@/actions/users"
import { queries } from "@/lib/query-client"
import { IActionResponse } from "@/models/action-response"
import { IUserView } from "@/models/user"
import { useQuery } from "@tanstack/react-query"

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
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  })

  return {
    attendants,
    isLoadingAttendants
  }
}